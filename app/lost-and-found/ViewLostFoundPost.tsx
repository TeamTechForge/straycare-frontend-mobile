import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Linking,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getAnimalPostById, reportAnimalPost } from '../../api/apiService';
import { AnimalPost, deleteAnimalPost } from '../../services/lostAndFoundService';
import { useCall } from '../../contexts/CallContext';
import { useAuth } from '../../contexts/AuthContext';
import { useChatApi } from '../../hooks/useChatApi';
import { BASE_URL } from '../../constants/config.constants';
import OwnerActionButtons from '../../components/OwnerActionButtons';

// ─── Colour changes were made ────────────────────────────────────────────────────────────
const C = {
  bg: '#F9F9FF',
  surface: '#FFFFFF',
  surfaceLow: '#F0F3FF',
  surfaceHighest: '#DCE2F3',
  primary: '#F5A623',
  primaryContainer: '#FFF7E6',
  onPrimary: '#FFFFFF',
  outlineVariant: '#F5A623',
  textMain: '#151C27',
  textSub: '#717878',
  textSecondary: '#5B5F63',
  orange50: '#FFF7F0',
  orangeBorder: '#FFE5D0',
  error: '#BA1A1A',
  errorBg: '#FFDAD6',
};

const { width: SCREEN_W } = Dimensions.get('window');
const IMAGE_HEIGHT = 280;
// BASE_URL is imported from constants

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getAnimalLabel = (post: AnimalPost) => {
  if (!post.type || post.type === 'other') return post.customType || 'Animal';
  return post.type.charAt(0).toUpperCase() + post.type.slice(1);
};


const statusConfig = {
  lost: { bg: '#F5A623', text: '#FFFFFF', label: 'Lost' },
  found: { bg: '#2E7D32', text: '#FFFFFF', label: 'Found' },
};

// Build the full image URL from whatever the backend returns
const resolveImageUrl = (post: AnimalPost): string | null => {
  const url = post.imageUrl || (post.images && post.images.length > 0 ? post.images[0] : null);
  if (!url) return null;
  if (url.startsWith('http')) return url;
  // Backend returns a relative path like "/uploads/photo.jpg"
  return `${BASE_URL}${url}`;
};

// ─── Loading skeleton ─────────────────────────────────────────────────────────
const LoadingSkeleton = () => (
  <View style={sk.wrap}>
    <View style={sk.image} />
    <View style={sk.card}>
      <View style={sk.row}>
        <View style={sk.chip} />
        <View style={sk.pill} />
      </View>
      <View style={sk.titleLg} />
      <View style={sk.line} />
      <View style={[sk.line, { width: '70%' }]} />
      <View style={sk.divider} />
      <View style={sk.infoRow} />
      <View style={sk.infoRow} />
      <View style={sk.contactBox} />
    </View>
  </View>
);

const sk = StyleSheet.create({
  wrap: { flex: 1 },
  image: { width: SCREEN_W, height: IMAGE_HEIGHT, backgroundColor: '#E2E0D6' },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 20,
    padding: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14
  },

  chip: {
    width: 60,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#F0EDE8'
  },

  pill: {
    width: 60,
    height: 24,
    borderRadius: 999,
    backgroundColor: '#F0EDE8'
  },

  titleLg: {
    width: '55%',
    height: 28,
    borderRadius: 6,
    backgroundColor: '#F0EDE8',
    marginBottom: 12
  },

  line: {
    width: '100%',
    height: 14,
    borderRadius: 6,
    backgroundColor: '#F0EDE8',
    marginBottom: 8
  },

  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 16
  },

  infoRow: {
    width: '80%',
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F0EDE8',
    marginBottom: 12
  },

  contactBox: {
    width: '100%',
    height: 72,
    borderRadius: 14,
    backgroundColor: '#F0EDE8',
    marginTop: 6
  },
});

// ─── Error view ───────────────────────────────────────────────────────────────
const ErrorView = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <View style={ev.wrap}>
    <Ionicons name="alert-circle-outline" size={52} color={C.error} />
    <Text style={ev.title}>Something went wrong</Text>
    <Text style={ev.msg}>{message}</Text>
    <TouchableOpacity style={ev.btn} onPress={onRetry}>
      <Text style={ev.btnText}>Try Again</Text>
    </TouchableOpacity>
  </View>
);

const ev = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  title: { fontSize: 18, fontWeight: '700', color: C.textMain },
  msg: { fontSize: 13, color: C.textSub, textAlign: 'center', lineHeight: 20 },
  btn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: C.primaryContainer,
  },
  btnText: { fontSize: 14, fontWeight: '700', color: C.onPrimary },
});

// ─── Main Component ───────────────────────────────────────────────────────────
const ViewAnimalPost = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [post, setPost] = useState<AnimalPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [isReporting, setIsReporting] = useState(false);

  // ─── Animations ────────────────────────────────────────────────────────────
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;

  const runEntranceAnim = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(28);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 75, friction: 9, useNativeDriver: true }),
    ]).start();
  };

  // ─── Fetch post from DB ─────────────────────────────────────────────────────
  const fetchPost = useCallback(async (isRefresh = false) => {
    if (!id) {
      setError('No post ID provided.');
      setLoading(false);
      return;
    }

    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError('');

      const data = await getAnimalPostById(id);
      setPost(data || null);
      if (!isRefresh) runEntranceAnim();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to load post. Please check your connection.';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const { startCall } = useCall();
  const { user } = useAuth();
  const { createConversation } = useChatApi();

  // ─── Call handler ───────────────────────────────────────────────────────────
  const handleCall = () => {
    if (!post) return;
    const rawUserId = (post as any).userId;
    const ownerId = typeof rawUserId === 'object' && rawUserId !== null ? rawUserId._id : (rawUserId || (post as any).ownerId || (post as any).postedBy);
    if (!ownerId) {
      Alert.alert(
        'Contact Unavailable',
        'In-app calling requires the user ID, which is not available for this post.'
      );
      return;
    }
    startCall(String(ownerId), post.contactName || 'User');
  };

  // ─── Message handler ────────────────────────────────────────────────────────
  const handleMessage = async () => {
    if (!post) return;
    const rawUserId = (post as any).userId;
    const ownerId = typeof rawUserId === 'object' && rawUserId !== null ? rawUserId._id : (rawUserId || (post as any).ownerId || (post as any).postedBy);
    if (!ownerId) {
      Alert.alert('Contact Unavailable', 'User ID is not available for this post.');
      return;
    }
    if (user?._id === ownerId) {
      Alert.alert('Error', 'You cannot message yourself.');
      return;
    }
    
    try {
      const conversation = (await createConversation(String(ownerId), "direct")) as any;
      const otherParticipant = conversation.participants?.find(
        (p: any) => p._id !== user?._id
      );

      router.push({
        pathname: "/chat/[conversationId]",
        params: {
          conversationId: conversation._id,
          recipientName: otherParticipant?.name || post.contactName || "User",
          recipientId: String(ownerId),
          recipientImage: otherParticipant?.profileImage || (typeof rawUserId === 'object' ? rawUserId.avatar : ""),
        },
      });
    } catch (err: any) {
      Alert.alert('Could Not Start Chat', err.message || 'Something went wrong.');
    }
  };

  // ─── Delete handler ─────────────────────────────────────────────────────────
  const handleDelete = () => {
    if (!post) return;
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAnimalPost(post._id);
              Alert.alert('Deleted', 'Your post has been deleted.');
              router.back();
            } catch (err) {
              Alert.alert("Error", "Failed to delete the post.");
            }
          },
        },
      ]
    );
  };

  // ─── Report handler ─────────────────────────────────────────────────────────
  const handleReport = () => {
    if (!post) return;
    Alert.alert(
      'Report Post',
      'Are you sure you want to report this post as inappropriate?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsReporting(true);
              await reportAnimalPost(post._id);
              Alert.alert('Reported', 'Thank you. This post has been reported for review.');
            } catch (err: any) {
              Alert.alert(
                'Error',
                err?.response?.data?.message || 'Failed to report post. Please try again.'
              );
            } finally {
              setIsReporting(false);
            }
          },
        },
      ]
    );
  };

  // ─── Render states ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={s.root}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        <LoadingSkeleton />
      </View>
    );
  }

  if (error || !post) {
    return (
      <View style={s.root}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        <TouchableOpacity style={s.safeBack} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={C.textMain} />
        </TouchableOpacity>
        <ErrorView message={error || 'Post not found.'} onRetry={() => fetchPost()} />
      </View>
    );
  }

  const sc = statusConfig[post.status] ?? statusConfig.lost;
  const imageUrl = resolveImageUrl(post);

  // ─── Main render ────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchPost(true)}
            tintColor={C.primaryContainer}
            colors={[C.primaryContainer]}
          />
        }
      >
        {/* ── Hero image ── */}
        <View style={s.imageContainer}>
          {imageUrl ? (
            <Animated.Image
              source={{ uri: imageUrl }}
              style={s.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={s.imagePlaceholder}>
              <Ionicons name="paw" size={64} color="rgba(255,255,255,0.4)" />
              <Text style={s.imagePlaceholderText}>No photo provided</Text>
            </View>
          )}
          <View style={s.imageOverlay} />

          <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.85}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* ── Detail card ── */}
        <Animated.View
          style={[s.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          {/* Chips + status pill */}
          <View style={s.chipsRow}>
            <View style={s.chipsLeft}>
              <View style={s.chip}>
                <Text style={s.chipText}>{getAnimalLabel(post).toUpperCase()}</Text>
              </View>
              {post.breed ? (
                <View style={s.chip}>
                  <Text style={s.chipText}>{post.breed.toUpperCase()}</Text>
                </View>
              ) : null}
            </View>
            <View style={[s.statusPill, { backgroundColor: sc.bg }]}>
              <View style={s.statusDot} />
              <Text style={[s.statusText, { color: sc.text }]}>{sc.label}</Text>
            </View>
          </View>

          {/* Pet name */}
          <Text style={s.petName}>{post.name || 'Unknown Name'}</Text>

          {/* Description */}
          <Text style={s.description}>{post.description}</Text>

          <View style={s.divider} />

          {/* Location */}
          <View style={s.infoRow}>
            <View style={s.iconCircle}>
              <Ionicons name="location" size={18} color={C.primary} />
            </View>
            <View style={s.infoText}>
              <Text style={s.infoLabel}>Last Seen</Text>
              <Text style={s.infoValue}>{post.location}</Text>
            </View>
          </View>

          {/* Date */}
          <View style={s.infoRow}>
            <View style={s.iconCircle}>
              <Ionicons name="calendar" size={18} color={C.primary} />
            </View>
            <View style={s.infoText}>
              <Text style={s.infoLabel}>Date Reported</Text>
              <Text style={s.infoValue}>{post.date}</Text>
            </View>
          </View>

          {/* Contact card */}
          {(!user?._id || user._id !== ((post as any).userId?._id || (post as any).userId || (post as any).ownerId)) && (
            <View style={s.contactCard}>
              <TouchableOpacity 
                style={s.contactInfo}
                onPress={() => {
                  const rawUserId = (post as any).userId;
                  const ownerId = typeof rawUserId === 'object' && rawUserId !== null ? rawUserId._id : (rawUserId || (post as any).ownerId || (post as any).postedBy);
                  if (ownerId) router.push(`/profile/${ownerId}`);
                }}
                activeOpacity={0.8}
              >
                {typeof (post as any).userId === 'object' && ((post as any).userId.profileImage || (post as any).userId.avatar) ? (
                  <Image source={{ uri: (post as any).userId.profileImage || (post as any).userId.avatar }} style={s.contactAvatar} />
                ) : (
                  <View style={s.contactAvatarPlaceholder}>
                    <Ionicons name="person" size={24} color="#A0A0A0" />
                  </View>
                )}
                <View>
                  <Text style={s.contactLabel}>Contact Owner</Text>
                  <Text style={s.contactName}>{post.contactName}</Text>
                </View>
              </TouchableOpacity>
              
              <View style={s.contactActions}>
                <TouchableOpacity style={s.actionBtn} onPress={handleMessage} activeOpacity={0.85}>
                  <Ionicons name="chatbubble" size={20} color={C.onPrimary} />
                </TouchableOpacity>
                <TouchableOpacity style={s.actionBtn} onPress={handleCall} activeOpacity={0.85}>
                  <Ionicons name="call" size={20} color={C.onPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Action buttons if owner */}
          {user?._id && (
            user._id === ((post as any).userId?._id || (post as any).userId || (post as any).ownerId)
          ) && (
            <OwnerActionButtons 
              onEdit={() => router.push(`/lost-and-found/CreateLostFoundPost?postId=${post._id}`)}
              onDelete={handleDelete}
              editLabel="Edit Post"
            />
          )}
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

export default ViewAnimalPost;

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },

  safeBack: {
    padding: 16,
    paddingTop: 52,
    alignSelf: 'flex-start',
  },

  // Hero
  imageContainer: {
    width: SCREEN_W,
    height: IMAGE_HEIGHT,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#C8B4A8',
  },
  heroImage: { width: '100%', height: '100%' },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: '#C8B4A8',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imagePlaceholderText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '500',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  backBtn: {
    position: 'absolute',
    top: 52,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },

  // Card
  card: {
    backgroundColor: C.surface,
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  // Chips
  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  chipsLeft: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', flex: 1, marginRight: 10 },
  chip: {
    backgroundColor: C.orange50,
    borderWidth: 1,
    borderColor: C.orangeBorder,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, color: C.primary },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    shadowColor: '#F5A623',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.8)'
  },

  statusText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2
  },

  // Name & desc
  petName: {
    fontSize: 24,
    fontWeight: '800',
    color: C.textMain,
    letterSpacing: -0.4,
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: C.textSub,
    marginBottom: 20
  },

  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 18
  },

  // Info rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14
  },

  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.orange50,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoText: { flex: 1 },

  infoLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: C.textSecondary,
    marginBottom: 2,
    letterSpacing: 0.3
  },

  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textMain
  },

  // Contact
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.surfaceLow,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.outlineVariant + '55',
    padding: 16,
    marginTop: 6,
  },
  contactLabel: { fontSize: 13, color: C.textSub, marginBottom: 2 },
  contactName: { fontSize: 16, fontWeight: '700', color: C.textMain },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0E0E0',
  },
  contactAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});


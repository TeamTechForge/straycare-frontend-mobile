import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Linking,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getAnimalPostById, reportAnimalPost } from '../../api/api';

// ─── Colour tokens ────────────────────────────────────────────────────────────
const C = {
  bg: '#F9F9FF',
  surface: '#FFFFFF',
  surfaceLow: '#F0F3FF',
  surfaceHighest: '#DCE2F3',
  primary: '#994700',
  primaryContainer: '#FF7A00',
  onPrimary: '#FFFFFF',
  outlineVariant: '#E0C0AF',
  textMain: '#151C27',
  textSub: '#584235',
  textSecondary: '#5B5F63',
  orange50: '#FFF7F0',
  orangeBorder: '#FFE5D0',
  error: '#BA1A1A',
  errorBg: '#FFDAD6',
};

const { width: SCREEN_W } = Dimensions.get('window');
const IMAGE_HEIGHT = 280;
const BASE_URL = 'http://10.225.98.94:5000';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AnimalPost {
  _id: string;
  status: 'lost' | 'found';
  type: 'dog' | 'cat' | 'other';
  customType?: string;
  breed?: string;
  name?: string;
  description: string;
  location: string;
  date: string;
  contactName: string;
  contactNumber: string;
  imageUrl?: string; // URL returned by backend after upload
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getAnimalLabel = (post: AnimalPost) => {
  if (post.type === 'other') return post.customType || 'Animal';
  return post.type.charAt(0).toUpperCase() + post.type.slice(1);
};

const statusConfig = {
  lost: { bg: '#FF7A00', text: '#FFFFFF', label: 'Lost' },
  found: { bg: '#2E7D32', text: '#FFFFFF', label: 'Found' },
};

// Build the full image URL from whatever the backend returns
const resolveImageUrl = (imageUrl?: string): string | null => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http')) return imageUrl;
  // Backend returns a relative path like "/uploads/photo.jpg"
  return `${BASE_URL}${imageUrl}`;
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
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  chip: { width: 60, height: 24, borderRadius: 8, backgroundColor: '#F0EDE8' },
  pill: { width: 60, height: 24, borderRadius: 999, backgroundColor: '#F0EDE8' },
  titleLg: { width: '55%', height: 28, borderRadius: 6, backgroundColor: '#F0EDE8', marginBottom: 12 },
  line: { width: '100%', height: 14, borderRadius: 6, backgroundColor: '#F0EDE8', marginBottom: 8 },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 16 },
  infoRow: { width: '80%', height: 40, borderRadius: 10, backgroundColor: '#F0EDE8', marginBottom: 12 },
  contactBox: { width: '100%', height: 72, borderRadius: 14, backgroundColor: '#F0EDE8', marginTop: 6 },
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
      setPost(data);
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

  // ─── Call handler ───────────────────────────────────────────────────────────
  const handleCall = () => {
    if (!post) return;
    const url = `tel:${post.contactNumber}`;
    Linking.canOpenURL(url).then(ok => {
      if (ok) Linking.openURL(url);
      else Alert.alert('Call', `Contact number: ${post.contactNumber}`);
    });
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
  const imageUrl = resolveImageUrl(post.imageUrl);

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
          <View style={s.contactCard}>
            <View>
              <Text style={s.contactLabel}>Contact Owner</Text>
              <Text style={s.contactName}>{post.contactName}</Text>
            </View>
            <TouchableOpacity style={s.callBtn} onPress={handleCall} activeOpacity={0.85}>
              <Ionicons name="call" size={20} color={C.onPrimary} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Fixed footer ── */}
      <Animated.View style={[s.footer, { opacity: fadeAnim }]}>
        <TouchableOpacity style={s.footerBackBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={17} color={C.textMain} />
          <Text style={s.footerBackText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.reportBtn, isReporting && s.reportBtnDisabled]}
          onPress={handleReport}
          activeOpacity={0.85}
          disabled={isReporting}
        >
          {isReporting ? (
            <ActivityIndicator size="small" color={C.onPrimary} />
          ) : (
            <Ionicons name="flag" size={17} color={C.onPrimary} />
          )}
          <Text style={s.reportBtnText}>{isReporting ? 'Reporting…' : 'Report Post'}</Text>
        </TouchableOpacity>
      </Animated.View>
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
    shadowColor: '#FF7A00',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.8)' },
  statusText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.2 },

  // Name & desc
  petName: {
    fontSize: 24,
    fontWeight: '800',
    color: C.textMain,
    letterSpacing: -0.4,
    marginBottom: 10,
  },
  description: { fontSize: 14, lineHeight: 22, color: C.textSub, marginBottom: 20 },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginBottom: 18 },

  // Info rows
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
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
  infoLabel: { fontSize: 11, fontWeight: '500', color: C.textSecondary, marginBottom: 2, letterSpacing: 0.3 },
  infoValue: { fontSize: 14, fontWeight: '600', color: C.textMain },

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
  contactLabel: { fontSize: 11, fontWeight: '500', color: C.textSecondary, marginBottom: 3, letterSpacing: 0.3 },
  contactName: { fontSize: 18, fontWeight: '700', color: C.textMain, letterSpacing: -0.2 },
  callBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF7A00',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 30,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  footerBackBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: C.surfaceHighest,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  footerBackText: { fontSize: 14, fontWeight: '600', color: C.textMain },
  reportBtn: {
    flex: 2,
    height: 52,
    borderRadius: 14,
    backgroundColor: C.primaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#FF7A00',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  reportBtnDisabled: { backgroundColor: '#E2DFD4', shadowOpacity: 0 },
  reportBtnText: { fontSize: 14, fontWeight: '700', color: C.onPrimary },
});
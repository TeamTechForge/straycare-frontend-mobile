import {
    MaterialCommunityIcons,
    MaterialIcons,
} from "@expo/vector-icons";

import { useRouter } from "expo-router";
import { useState } from "react";

import {
    Alert,
    Image,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { CommunityPost } from "../services/communityService";

// ─────────────────────────────────────────────
// COLORS
// ─────────────────────────────────────────────

const C = {
    white: "#FFFFFF",

    text: "#121C2C",

    textSecondary: "#4D4637",

    outline: "#7F7665",

    orange: "#F28C28",

    lightOrange: "#FFF2E2",

    darkOrange: "#B75D00",
};

// ─────────────────────────────────────────────
// REPORT REASONS
// ─────────────────────────────────────────────

const REPORT_REASONS = [
    "Misleading or sensational",
    "Violent or repulsive",
    "Hateful or abusive",
    "Intrusive or too personal",
    "Spam or irrelevant",
    "Other",
];

// ─────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────

interface CommunityPostCardProps {
    post: CommunityPost;

    onReport: (
        postId: string,
        reason: string
    ) => Promise<void>;
}

// ─────────────────────────────────────────────
// DATE FORMAT
// ─────────────────────────────────────────────

function formatDate(
    dateStr?: string
): string {
    if (!dateStr) {
        return "";
    }

    const date =
        new Date(dateStr);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    return date
        .toLocaleDateString(
            "en-US",
            {
                month: "short",

                day: "numeric",

                year: "numeric",
            }
        )
        .toUpperCase();
}

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

export default function CommunityPostCard({
    post,
    onReport,
}: CommunityPostCardProps) {
    const router =
        useRouter();

    const [liked, setLiked] =
        useState(false);

    const [saved, setSaved] =
        useState(false);

    // Three dot menu
    const [
        menuVisible,
        setMenuVisible,
    ] = useState(false);

    // Report popup
    const [
        reportVisible,
        setReportVisible,
    ] = useState(false);

    // Selected report reason
    const [
        selectedReason,
        setSelectedReason,
    ] = useState("");

    // Text entered for Other
    const [
        otherReason,
        setOtherReason,
    ] = useState("");

    // Prevent duplicate report submissions
    const [
        submitting,
        setSubmitting,
    ] = useState(false);

    // ─────────────────────────────────────────────
    // OPEN POST
    // ─────────────────────────────────────────────

    const handleOpenPost =
        () => {
            router.push({
                pathname:
                    "/community-feed/CommunityPostView",

                params: {
                    id: post._id,
                },
            });
        };

    // ─────────────────────────────────────────────
    // SAVE POST
    // ─────────────────────────────────────────────

    const handleSavePost =
        () => {
            setSaved(
                (previous) =>
                    !previous
            );

            setMenuVisible(false);
        };

    // ─────────────────────────────────────────────
    // OPEN REPORT
    // ─────────────────────────────────────────────

    const handleOpenReport =
        () => {
            setMenuVisible(false);

            setReportVisible(true);
        };

    // ─────────────────────────────────────────────
    // CLOSE REPORT
    // ─────────────────────────────────────────────

    const handleCloseReport =
        () => {
            if (submitting) {
                return;
            }

            setReportVisible(false);

            setSelectedReason("");

            setOtherReason("");
        };

    // ─────────────────────────────────────────────
    // SELECT REPORT REASON
    // ─────────────────────────────────────────────

    const handleSelectReason = (
        reason: string
    ) => {
        setSelectedReason(reason);

        // Remove custom text when
        // another option is selected
        if (reason !== "Other") {
            setOtherReason("");
        }
    };

    // ─────────────────────────────────────────────
    // SUBMIT REPORT
    // ─────────────────────────────────────────────

    const handleSubmitReport =
        async () => {
            // User must select a reason
            if (!selectedReason) {
                Alert.alert(
                    "Select a reason",
                    "Please select a reason for reporting this post."
                );

                return;
            }

            // Other requires typed reason
            if (
                selectedReason ===
                "Other" &&
                otherReason.trim() ===
                ""
            ) {
                Alert.alert(
                    "Enter a reason",
                    "Please type your report reason."
                );

                return;
            }

            const finalReason =
                selectedReason ===
                    "Other"
                    ? otherReason.trim()
                    : selectedReason;

            try {
                setSubmitting(true);

                // Send report to main screen
                // Main screen calls service
                await onReport(
                    post._id,
                    finalReason
                );

                Alert.alert(
                    "Report Submitted",
                    "Thank you. Your report has been submitted successfully."
                );

                setReportVisible(false);

                setSelectedReason("");

                setOtherReason("");
            } catch (error) {
                console.error(
                    "Report error:",
                    error
                );

                Alert.alert(
                    "Report Failed",
                    "Unable to submit your report. Please try again."
                );
            } finally {
                setSubmitting(false);
            }
        };

    return (
        <>
            {/* POST CARD */}

            <TouchableOpacity
                activeOpacity={0.96}
                onPress={
                    handleOpenPost
                }
            >
                <View style={styles.card}>
                    {/* HEADER */}

                    <View
                        style={styles.cardHeader}
                    >
                        <View
                            style={styles.authorRow}
                        >
                            {/* PROFILE PICTURE / FALLBACK */}

                            <View
                                style={
                                    styles.avatarPlaceholder
                                }
                            >
                                <Text
                                    style={
                                        styles.avatarLetter
                                    }
                                >
                                    {post.authorName
                                        ?.charAt(0)
                                        .toUpperCase() ||
                                        "?"}
                                </Text>
                            </View>

                            {/* AUTHOR DETAILS */}

                            <View
                                style={
                                    styles.authorInfo
                                }
                            >
                                <Text
                                    style={
                                        styles.authorName
                                    }
                                >
                                    {post.authorName ||
                                        "Community User"}
                                </Text>

                                <Text
                                    style={
                                        styles.authorMeta
                                    }
                                    numberOfLines={1}
                                >
                                    {formatDate(
                                        post.submittedAt ||
                                        post.createdAt
                                    )}

                                    {" • "}

                                    {post.category}
                                </Text>
                            </View>
                        </View>

                        {/* VERTICAL THREE DOTS */}

                        <TouchableOpacity
                            style={
                                styles.moreButton
                            }
                            activeOpacity={0.6}
                            onPress={(event) => {
                                event.stopPropagation();

                                setMenuVisible(true);
                            }}
                        >
                            <MaterialIcons
                                name="more-vert"
                                size={26}
                                color={C.outline}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* POST IMAGE */}

                    {post.imageUrl ? (
                        <Image
                            source={{
                                uri: post.imageUrl,
                            }}
                            style={
                                styles.postImage
                            }
                            resizeMode="cover"
                        />
                    ) : null}

                    {/* POST BODY */}

                    <View
                        style={styles.cardBody}
                    >
                        <Text
                            style={styles.postTitle}
                        >
                            {post.title}
                        </Text>

                        <Text
                            style={styles.postBody}
                            numberOfLines={4}
                        >
                            {post.content}
                        </Text>
                    </View>

                    {/* ACTIONS */}

                    <View
                        style={styles.actionsRow}
                    >
                        {/* LIKE */}

                        <TouchableOpacity
                            style={styles.actionBtn}
                            activeOpacity={0.7}
                            onPress={(event) => {
                                event.stopPropagation();

                                setLiked(
                                    (previous) =>
                                        !previous
                                );
                            }}
                        >
                            <MaterialCommunityIcons
                                name={
                                    liked
                                        ? "heart"
                                        : "heart-outline"
                                }
                                size={23}
                                color={
                                    liked
                                        ? C.orange
                                        : C.textSecondary
                                }
                            />
                        </TouchableOpacity>

                        {/* SAVE */}

                        <TouchableOpacity
                            style={styles.actionBtn}
                            activeOpacity={0.7}
                            onPress={(event) => {
                                event.stopPropagation();

                                handleSavePost();
                            }}
                        >
                            <MaterialCommunityIcons
                                name={
                                    saved
                                        ? "bookmark"
                                        : "bookmark-outline"
                                }
                                size={23}
                                color={
                                    saved
                                        ? C.orange
                                        : C.textSecondary
                                }
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>

            {/* ───────────────────────────────────── */}
            {/* THREE DOT MENU */}
            {/* ───────────────────────────────────── */}

            <Modal
                visible={menuVisible}
                transparent
                animationType="fade"
                onRequestClose={() =>
                    setMenuVisible(false)
                }
            >
                <Pressable
                    style={styles.menuOverlay}
                    onPress={() =>
                        setMenuVisible(false)
                    }
                >
                    <Pressable
                        style={
                            styles.menuContainer
                        }
                        onPress={(event) =>
                            event.stopPropagation()
                        }
                    >
                        {/* SAVE POST */}

                        <TouchableOpacity
                            style={styles.menuItem}
                            activeOpacity={0.7}
                            onPress={
                                handleSavePost
                            }
                        >
                            <MaterialCommunityIcons
                                name={
                                    saved
                                        ? "bookmark"
                                        : "bookmark-outline"
                                }
                                size={22}
                                color={C.text}
                            />

                            <Text
                                style={
                                    styles.menuItemText
                                }
                            >
                                {saved
                                    ? "Remove Saved Post"
                                    : "Save Post"}
                            </Text>
                        </TouchableOpacity>

                        <View
                            style={
                                styles.menuDivider
                            }
                        />

                        {/* REPORT POST */}

                        <TouchableOpacity
                            style={styles.menuItem}
                            activeOpacity={0.7}
                            onPress={
                                handleOpenReport
                            }
                        >
                            <MaterialCommunityIcons
                                name="flag-outline"
                                size={22}
                                color={C.orange}
                            />

                            <Text
                                style={
                                    styles.reportMenuText
                                }
                            >
                                Report Post
                            </Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* ───────────────────────────────────── */}
            {/* REPORT MODAL */}
            {/* ───────────────────────────────────── */}

            <Modal
                visible={
                    reportVisible
                }
                transparent
                animationType="fade"
                onRequestClose={
                    handleCloseReport
                }
            >
                <Pressable
                    style={
                        styles.reportOverlay
                    }
                    onPress={
                        handleCloseReport
                    }
                >
                    <Pressable
                        style={
                            styles.reportModal
                        }
                        onPress={(event) =>
                            event.stopPropagation()
                        }
                    >
                        {/* REPORT HEADER */}

                        <View
                            style={
                                styles.reportHeader
                            }
                        >
                            <View
                                style={{ flex: 1 }}
                            >
                                <Text
                                    style={
                                        styles.reportTitle
                                    }
                                >
                                    Submit a report
                                </Text>

                                <Text
                                    style={
                                        styles.reportDescription
                                    }
                                >
                                    Tell us why you are
                                    reporting this post.
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={
                                    styles.closeButton
                                }
                                disabled={
                                    submitting
                                }
                                onPress={
                                    handleCloseReport
                                }
                            >
                                <MaterialIcons
                                    name="close"
                                    size={23}
                                    color={C.outline}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* REPORT REASONS */}

                        {REPORT_REASONS.map(
                            (reason) => {
                                const isSelected =
                                    selectedReason ===
                                    reason;

                                return (
                                    <TouchableOpacity
                                        key={reason}
                                        style={[
                                            styles.reportReasonRow,

                                            isSelected &&
                                            styles.reportReasonSelected,
                                        ]}
                                        activeOpacity={0.7}
                                        onPress={() =>
                                            handleSelectReason(
                                                reason
                                            )
                                        }
                                    >
                                        {/* CUSTOM RADIO BUTTON */}

                                        <View
                                            style={[
                                                styles.radioOuter,

                                                isSelected &&
                                                styles.radioOuterSelected,
                                            ]}
                                        >
                                            {isSelected && (
                                                <View
                                                    style={
                                                        styles.radioInner
                                                    }
                                                />
                                            )}
                                        </View>

                                        <Text
                                            style={[
                                                styles.reportReasonText,

                                                isSelected &&
                                                styles.reportReasonTextSelected,
                                            ]}
                                        >
                                            {reason}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            }
                        )}

                        {/* OTHER INPUT */}

                        {selectedReason ===
                            "Other" && (
                                <View
                                    style={
                                        styles.otherInputWrapper
                                    }
                                >
                                    <Text
                                        style={
                                            styles.otherInputLabel
                                        }
                                    >
                                        Tell us your reason
                                    </Text>

                                    <TextInput
                                        style={
                                            styles.otherInput
                                        }
                                        placeholder="Type your reason here..."
                                        placeholderTextColor="#999999"
                                        value={otherReason}
                                        onChangeText={
                                            setOtherReason
                                        }
                                        multiline
                                        maxLength={300}
                                    />

                                    <Text
                                        style={
                                            styles.characterCount
                                        }
                                    >
                                        {otherReason.length}
                                        /300
                                    </Text>
                                </View>
                            )}

                        {/* BUTTONS */}

                        <View
                            style={
                                styles.reportButtons
                            }
                        >
                            <TouchableOpacity
                                style={
                                    styles.cancelButton
                                }
                                disabled={
                                    submitting
                                }
                                onPress={
                                    handleCloseReport
                                }
                            >
                                <Text
                                    style={
                                        styles.cancelButtonText
                                    }
                                >
                                    Cancel
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.reportButton,

                                    (!selectedReason ||
                                        submitting ||
                                        (selectedReason ===
                                            "Other" &&
                                            !otherReason.trim())) &&
                                    styles.reportButtonDisabled,
                                ]}
                                disabled={
                                    !selectedReason ||
                                    submitting ||
                                    (selectedReason ===
                                        "Other" &&
                                        !otherReason.trim())
                                }
                                activeOpacity={0.8}
                                onPress={
                                    handleSubmitReport
                                }
                            >
                                <Text
                                    style={
                                        styles.reportButtonText
                                    }
                                >
                                    {submitting
                                        ? "Reporting..."
                                        : "Report"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </>
    );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
    card: {
        backgroundColor:
            C.white,

        borderRadius: 14,

        overflow: "hidden",

        borderWidth: 1,

        borderColor:
            "#D1C5B225",

        shadowColor: "#000",

        shadowOffset: {
            width: 0,
            height: 2,
        },

        shadowOpacity: 0.07,

        shadowRadius: 5,

        elevation: 3,
    },

    // HEADER

    cardHeader: {
        flexDirection: "row",

        justifyContent:
            "space-between",

        alignItems: "center",

        paddingHorizontal: 12,

        paddingVertical: 12,
    },

    authorRow: {
        flex: 1,

        flexDirection: "row",

        alignItems: "center",

        gap: 10,
    },

    authorInfo: {
        flex: 1,
    },

    // PROFILE FALLBACK

    avatarPlaceholder: {
        width: 38,

        height: 38,

        borderRadius: 19,

        backgroundColor:
            C.lightOrange,

        alignItems: "center",

        justifyContent: "center",
    },

    avatarLetter: {
        fontSize: 16,

        fontWeight: "700",

        color:
            C.orange,
    },

    authorName: {
        fontSize: 13,

        fontWeight: "700",

        color:
            C.text,
    },

    authorMeta: {
        fontSize: 10,

        color:
            C.outline,

        marginTop: 2,
    },

    // VERTICAL THREE DOT BUTTON

    moreButton: {
        width: 38,

        height: 38,

        borderRadius: 19,

        alignItems: "center",

        justifyContent: "center",
    },

    // IMAGE

    postImage: {
        width: "100%",

        aspectRatio: 4 / 3,
    },

    // BODY

    cardBody: {
        paddingHorizontal: 14,

        paddingTop: 13,

        paddingBottom: 14,

        gap: 5,
    },

    postTitle: {
        fontSize: 16,

        fontWeight: "700",

        color:
            C.text,
    },

    postBody: {
        fontSize: 13,

        color:
            C.textSecondary,

        lineHeight: 20,
    },

    // BOTTOM ACTIONS

    actionsRow: {
        flexDirection: "row",

        justifyContent:
            "space-between",

        alignItems: "center",

        paddingHorizontal: 14,

        paddingVertical: 10,

        borderTopWidth: 1,

        borderTopColor:
            "#D1C5B220",
    },

    actionBtn: {
        padding: 3,
    },

    // ─────────────────────────────────────────
    // THREE DOT MENU
    // ─────────────────────────────────────────

    menuOverlay: {
        flex: 1,

        backgroundColor:
            "rgba(0,0,0,0.08)",

        justifyContent:
            "flex-start",

        alignItems: "flex-end",

        paddingTop: 90,

        paddingRight: 20,
    },

    menuContainer: {
        width: 205,

        backgroundColor:
            "#FFFFFF",

        borderRadius: 14,

        paddingVertical: 7,

        borderWidth: 1,

        borderColor:
            "#EEEEEE",

        shadowColor: "#000",

        shadowOffset: {
            width: 0,
            height: 4,
        },

        shadowOpacity: 0.18,

        shadowRadius: 8,

        elevation: 10,
    },

    menuItem: {
        flexDirection: "row",

        alignItems: "center",

        gap: 12,

        paddingHorizontal: 16,

        paddingVertical: 14,
    },

    menuItemText: {
        fontSize: 14,

        fontWeight: "500",

        color:
            C.text,
    },

    reportMenuText: {
        fontSize: 14,

        fontWeight: "600",

        color:
            C.orange,
    },

    menuDivider: {
        height: 1,

        backgroundColor:
            "#EEEEEE",

        marginHorizontal: 10,
    },

    // ─────────────────────────────────────────
    // REPORT MODAL
    // ─────────────────────────────────────────

    reportOverlay: {
        flex: 1,

        backgroundColor:
            "rgba(0,0,0,0.45)",

        justifyContent: "center",

        alignItems: "center",

        paddingHorizontal: 20,
    },

    reportModal: {
        width: "100%",

        maxWidth: 430,

        backgroundColor:
            C.white,

        borderRadius: 24,

        paddingHorizontal: 22,

        paddingTop: 22,

        paddingBottom: 20,

        shadowColor: "#000",

        shadowOffset: {
            width: 0,
            height: 6,
        },

        shadowOpacity: 0.22,

        shadowRadius: 12,

        elevation: 12,
    },

    reportHeader: {
        flexDirection: "row",

        justifyContent:
            "space-between",

        alignItems:
            "flex-start",

        marginBottom: 14,
    },

    reportTitle: {
        fontSize: 23,

        fontWeight: "700",

        color:
            C.text,
    },

    reportDescription: {
        fontSize: 13,

        color:
            C.outline,

        lineHeight: 19,

        marginTop: 5,
    },

    closeButton: {
        width: 35,

        height: 35,

        alignItems: "center",

        justifyContent: "center",

        borderRadius: 18,
    },

    // REPORT REASONS

    reportReasonRow: {
        flexDirection: "row",

        alignItems: "center",

        paddingHorizontal: 10,

        paddingVertical: 12,

        borderRadius: 11,

        marginBottom: 4,
    },

    reportReasonSelected: {
        backgroundColor:
            C.lightOrange,
    },

    reportReasonText: {
        flex: 1,

        fontSize: 15,

        color:
            C.textSecondary,
    },

    reportReasonTextSelected: {
        color:
            C.orange,

        fontWeight: "600",
    },

    // RADIO

    radioOuter: {
        width: 24,

        height: 24,

        borderRadius: 12,

        borderWidth: 2,

        borderColor:
            "#AAAAAA",

        alignItems: "center",

        justifyContent: "center",

        marginRight: 14,
    },

    radioOuterSelected: {
        borderColor:
            C.orange,
    },

    radioInner: {
        width: 12,

        height: 12,

        borderRadius: 6,

        backgroundColor:
            C.orange,
    },

    // OTHER INPUT

    otherInputWrapper: {
        marginTop: 8,

        marginBottom: 4,
    },

    otherInputLabel: {
        fontSize: 13,

        fontWeight: "600",

        color:
            C.text,

        marginBottom: 7,
    },

    otherInput: {
        minHeight: 90,

        borderWidth: 1.5,

        borderColor:
            C.orange,

        borderRadius: 12,

        paddingHorizontal: 12,

        paddingVertical: 10,

        fontSize: 14,

        color:
            C.text,

        backgroundColor:
            C.white,

        textAlignVertical:
            "top",
    },

    characterCount: {
        fontSize: 11,

        color:
            "#999999",

        textAlign: "right",

        marginTop: 4,
    },

    // REPORT BUTTONS

    reportButtons: {
        flexDirection: "row",

        justifyContent:
            "flex-end",

        alignItems: "center",

        gap: 12,

        marginTop: 18,
    },

    cancelButton: {
        minWidth: 100,

        paddingHorizontal: 20,

        paddingVertical: 12,

        borderRadius: 999,

        borderWidth: 1.5,

        borderColor:
            C.orange,

        backgroundColor:
            C.white,

        alignItems: "center",
    },

    cancelButtonText: {
        color:
            C.orange,

        fontSize: 14,

        fontWeight: "700",
    },

    reportButton: {
        minWidth: 105,

        paddingHorizontal: 22,

        paddingVertical: 13,

        borderRadius: 999,

        backgroundColor:
            C.orange,

        alignItems: "center",
    },

    reportButtonDisabled: {
        backgroundColor:
            "#F6C38F",
    },

    reportButtonText: {
        color:
            "#FFFFFF",

        fontSize: 14,

        fontWeight: "700",
    },
});
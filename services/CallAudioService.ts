import { Audio } from "expo-av";

class CallAudioService {
  private incomingRingtone: Audio.Sound | null = null;
  private outgoingRingback: Audio.Sound | null = null;

  /**
   * Initializes the audio mode to allow playback in the background and respect silent mode.
   */
  private async initAudioMode() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error("[CallAudioService] Failed to init audio mode", error);
    }
  }

  /**
   * Play the incoming ringtone
   */
  public async playIncoming() {
    try {
      await this.initAudioMode();
      this.stopAll(); // Ensure nothing else is playing

      const { sound } = await Audio.Sound.createAsync(
        require("../assets/sounds/ringtone.wav"),
        { isLooping: true, shouldPlay: true }
      );
      this.incomingRingtone = sound;
    } catch (error) {
      console.error("[CallAudioService] Failed to play incoming ringtone", error);
    }
  }

  /**
   * Play the outgoing ringback tone
   */
  public async playOutgoing() {
    try {
      await this.initAudioMode();
      this.stopAll(); // Ensure nothing else is playing

      const { sound } = await Audio.Sound.createAsync(
        require("../assets/sounds/ringback.wav"),
        { isLooping: true, shouldPlay: true }
      );
      this.outgoingRingback = sound;
    } catch (error) {
      console.error("[CallAudioService] Failed to play outgoing ringback", error);
    }
  }

  /**
   * Stop the incoming ringtone
   */
  public async stopIncoming() {
    try {
      if (this.incomingRingtone) {
        await this.incomingRingtone.stopAsync();
        await this.incomingRingtone.unloadAsync();
        this.incomingRingtone = null;
      }
    } catch (error) {
      console.error("[CallAudioService] Failed to stop incoming ringtone", error);
    }
  }

  /**
   * Stop the outgoing ringback tone
   */
  public async stopOutgoing() {
    try {
      if (this.outgoingRingback) {
        await this.outgoingRingback.stopAsync();
        await this.outgoingRingback.unloadAsync();
        this.outgoingRingback = null;
      }
    } catch (error) {
      console.error("[CallAudioService] Failed to stop outgoing ringback", error);
    }
  }

  /**
   * Stop all active audio playback
   */
  public async stopAll() {
    await this.stopIncoming();
    await this.stopOutgoing();
  }
}

export default new CallAudioService();

// Sound generation utilities for timer
export type SoundType = 'bell' | 'chime' | 'digital' | 'bowl'

export class SoundManager {
  private audioContext: AudioContext | null = null

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.audioContext = new AudioContextClass()
    }
    return this.audioContext
  }

  playSound(type: SoundType, volume: number = 70): void {
    const ctx = this.getAudioContext()
    const normalizedVolume = Math.max(0, Math.min(100, volume)) / 100

    switch (type) {
      case 'bell':
        this.playBell(ctx, normalizedVolume)
        break
      case 'chime':
        this.playChime(ctx, normalizedVolume)
        break
      case 'digital':
        this.playDigital(ctx, normalizedVolume)
        break
      case 'bowl':
        this.playSingingBowl(ctx, normalizedVolume)
        break
    }
  }

  private playBell(ctx: AudioContext, volume: number): void {
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.value = 800
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(volume * 0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 1)
  }

  private playChime(ctx: AudioContext, volume: number): void {
    const frequencies = [523.25, 659.25, 783.99] // C, E, G

    frequencies.forEach((freq, index) => {
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.frequency.value = freq
      oscillator.type = 'sine'

      const startTime = ctx.currentTime + index * 0.15
      gainNode.gain.setValueAtTime(volume * 0.2, startTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.8)

      oscillator.start(startTime)
      oscillator.stop(startTime + 0.8)
    })
  }

  private playDigital(ctx: AudioContext, volume: number): void {
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.setValueAtTime(880, ctx.currentTime)
    oscillator.frequency.setValueAtTime(1108.73, ctx.currentTime + 0.1)
    oscillator.type = 'square'

    gainNode.gain.setValueAtTime(volume * 0.2, ctx.currentTime)
    gainNode.gain.setValueAtTime(0, ctx.currentTime + 0.2)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.2)
  }

  private playSingingBowl(ctx: AudioContext, volume: number): void {
    const fundamentals = [220, 440, 660]

    fundamentals.forEach((freq) => {
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.frequency.value = freq
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(volume * 0.15, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 3)
    })
  }
}

export const soundManager = new SoundManager()

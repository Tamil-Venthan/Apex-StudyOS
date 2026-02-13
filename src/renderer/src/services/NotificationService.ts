export class NotificationService {
  /**
   * Request notification permission
   */
  static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }

    return false
  }

  /**
   * Show a desktop notification
   */
  static async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    const hasPermission = await this.requestPermission()

    if (!hasPermission) {
      console.warn('Notification permission denied')
      return
    }

    new Notification(title, {
      icon: '/icon.png',
      badge: '/icon.png',
      ...options
    })
  }

  /**
   * Show study reminder notification
   */
  static showStudyReminder(): void {
    this.showNotification('Time to Study! 📚', {
      body: 'Your daily study session is waiting. Keep up the momentum!',
      tag: 'study-reminder'
    })
  }

  /**
   * Show deadline alert
   */
  static showDeadlineAlert(title: string, hoursRemaining: number): void {
    const urgency = hoursRemaining <= 1 ? 'URGENT' : hoursRemaining <= 24 ? 'Soon' : 'Upcoming'
    this.showNotification(`${urgency}: ${title} ⏰`, {
      body: `Deadline in ${hoursRemaining}h. Time to take action!`,
      tag: 'deadline-alert',
      requireInteraction: hoursRemaining <= 1
    })
  }

  /**
   * Show streak celebration
   */
  static showStreakCelebration(days: number): void {
    this.showNotification(`${days} Day Streak! 🔥`, {
      body: `Amazing! You've studied for ${days} days in a row. Keep it going!`,
      tag: 'streak-celebration'
    })
  }

  /**
   * Show session complete notification
   */
  static showSessionComplete(duration: number): void {
    const minutes = Math.round(duration / 60)
    this.showNotification('Study Session Complete! ✅', {
      body: `Great work! You studied for ${minutes} minutes.`,
      tag: 'session-complete'
    })
  }

  /**
   * Schedule daily reminder (simplified - in production use a proper scheduler)
   */
  static scheduleDailyReminder(hour: number, minute: number): void {
    const now = new Date()
    const scheduledTime = new Date()
    scheduledTime.setHours(hour, minute, 0, 0)

    // If time already passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1)
    }

    const delay = scheduledTime.getTime() - now.getTime()

    setTimeout(() => {
      this.showStudyReminder()
      // Reschedule for next day
      this.scheduleDailyReminder(hour, minute)
    }, delay)
  }

  /**
   * Check for upcoming deadlines and schedule alerts
   */
  static checkUpcomingDeadlines(events: Array<{ title: string; date: Date }>): void {
    const now = new Date()

    events.forEach((event) => {
      const timeUntil = event.date.getTime() - now.getTime()
      const hoursUntil = timeUntil / (1000 * 60 * 60)

      // Alert 24 hours before
      if (hoursUntil > 0 && hoursUntil <= 24.5 && hoursUntil >= 23.5) {
        this.showDeadlineAlert(event.title, Math.round(hoursUntil))
      }

      // Alert 1 hour before
      if (hoursUntil > 0 && hoursUntil <= 1.1 && hoursUntil >= 0.9) {
        this.showDeadlineAlert(event.title, Math.round(hoursUntil))
      }
    })
  }
}

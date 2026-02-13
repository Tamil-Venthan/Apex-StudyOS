import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export class ExportService {
  /**
   * Export study sessions to CSV
   */
  static exportSessionsCSV(
    sessions: Array<{ completedAt: string | Date; duration: number; subject?: { name: string } }>
  ): string {
    const headers = ['Date', 'Subject', 'Duration (minutes)', 'Completed At']
    const rows = sessions.map((session) => [
      new Date(session.completedAt).toLocaleDateString(),
      session.subject?.name || 'General Study',
      Math.round(session.duration / 60),
      new Date(session.completedAt).toLocaleString()
    ])

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
    return csv
  }

  /**
   * Export subjects to CSV
   */
  static exportSubjectsCSV(
    subjects: Array<{
      name: string
      targetDate?: string | Date
      modules?: Array<{ topics?: Array<{ completed: boolean }> }>
    }>
  ): string {
    const headers = ['Subject', 'Modules', 'Topics', 'Completion %', 'Target Date']
    const rows = subjects.map((subject) => {
      const totalTopics =
        subject.modules?.reduce(
          (sum: number, mod: { topics?: Array<unknown> }) => sum + (mod.topics?.length || 0),
          0
        ) || 0
      const completedTopics =
        subject.modules?.reduce(
          (sum: number, mod: { topics?: Array<{ completed: boolean }> }) =>
            sum + (mod.topics?.filter((t) => t.completed).length || 0),
          0
        ) || 0
      const completion = totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0

      return [
        subject.name,
        subject.modules?.length || 0,
        totalTopics,
        `${completion}%`,
        subject.targetDate ? new Date(subject.targetDate).toLocaleDateString() : 'N/A'
      ]
    })

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
    return csv
  }

  /**
   * Generate study progress PDF report
   */
  static generateProgressReport(data: {
    userName: string
    examName: string
    totalStudyTime: number
    subjects: Array<{ modules?: Array<{ topics?: Array<{ completed: boolean }> }>; name: string }>
    sessions: Array<{ completedAt: string | Date; duration: number; subject?: { name: string } }>
  }): jsPDF {
    const doc = new jsPDF()

    // Title
    doc.setFontSize(20)
    doc.text('Study Progress Report', 14, 22)

    // User Info
    doc.setFontSize(12)
    doc.text(`Name: ${data.userName || 'Student'}`, 14, 32)
    doc.text(`Target Exam: ${data.examName || 'N/A'}`, 14, 38)
    doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, 14, 44)

    // Study Summary
    doc.setFontSize(14)
    doc.text('Study Summary', 14, 56)

    const hours = Math.floor(data.totalStudyTime / 3600)
    const minutes = Math.floor((data.totalStudyTime % 3600) / 60)

    autoTable(doc, {
      startY: 60,
      head: [['Metric', 'Value']],
      body: [
        ['Total Study Time', `${hours}h ${minutes}m`],
        ['Total Subjects', data.subjects.length],
        ['Total Sessions', data.sessions.length]
      ],
      theme: 'striped',
      headStyles: { fillColor: [139, 92, 246] }
    })

    // Subject Progress
    doc.addPage()
    doc.setFontSize(14)
    doc.text('Subject Progress', 14, 22)

    const subjectData = data.subjects.map((subject) => {
      const totalTopics =
        subject.modules?.reduce(
          (sum: number, mod: { topics?: Array<unknown> }) => sum + (mod.topics?.length || 0),
          0
        ) || 0
      const completedTopics =
        subject.modules?.reduce(
          (sum: number, mod: { topics?: Array<{ completed: boolean }> }) =>
            sum + (mod.topics?.filter((t) => t.completed).length || 0),
          0
        ) || 0
      const completion = totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0

      return [subject.name, totalTopics, completedTopics, `${completion}%`]
    })

    autoTable(doc, {
      startY: 28,
      head: [['Subject', 'Total Topics', 'Completed', 'Progress']],
      body: subjectData,
      theme: 'striped',
      headStyles: { fillColor: [139, 92, 246] }
    })

    // Recent Study Sessions
    if (data.sessions.length > 0) {
      doc.addPage()
      doc.setFontSize(14)
      doc.text('Recent Study Sessions (Last 10)', 14, 22)

      const sessionData = data.sessions
        .slice(-10)
        .map((session) => [
          new Date(session.completedAt).toLocaleDateString(),
          session.subject?.name || 'General',
          `${Math.round(session.duration / 60)} min`
        ])

      autoTable(doc, {
        startY: 28,
        head: [['Date', 'Subject', 'Duration']],
        body: sessionData,
        theme: 'striped',
        headStyles: { fillColor: [139, 92, 246] }
      })
    }

    return doc
  }

  /**
   * Create full data backup as JSON
   */
  static createBackup(data: {
    subjects: unknown[]
    courses: unknown[]
    sessions: unknown[]
    settings: unknown
  }): string {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data
    }
    return JSON.stringify(backup, null, 2)
  }

  /**
   * Trigger browser download
   */
  static downloadFile(content: string, filename: string, type: string): void {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /**
   * Download PDF
   */
  static downloadPDF(doc: jsPDF, filename: string): void {
    doc.save(filename)
  }
}

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useCourseStore } from '@renderer/stores/useCourseStore'
import AddCourseDialog from '@renderer/components/Course/AddCourseDialog'
import CourseCard from '@renderer/components/Course/CourseCard'

export default function MyClasses(): React.JSX.Element {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const { courses, loading, fetchCourses, deleteCourse } = useCourseStore()

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">My Classes</h1>
          <p className="text-muted-foreground">Track your online course attendance</p>
        </div>
        <button
          onClick={() => setShowAddDialog(true)}
          className="flex items-center gap-2 px-6 py-3 bg-secondary text-primary-foreground rounded-lg font-medium hover:bg-secondary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Course
        </button>
      </div>

      {/* Loading State */}
      {loading && courses.length === 0 && (
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-secondary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading courses...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && courses.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-12 rounded-xl text-center"
        >
          <div className="text-6xl mb-4">🎓</div>
          <h3 className="text-2xl font-semibold mb-2">No Courses Yet</h3>
          <p className="text-muted-foreground mb-6">Add your online courses to track attendance</p>
          <button
            onClick={() => setShowAddDialog(true)}
            className="px-6 py-3 bg-secondary text-primary-foreground rounded-lg font-medium hover:bg-secondary/90 transition-colors"
          >
            + Add Course
          </button>
        </motion.div>
      )}

      {/* Course Grid */}
      {!loading && courses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <CourseCard
                id={course.id}
                name={course.name}
                platform={course.platform}
                instructor={course.instructor}
                color={course.color}
                totalClasses={course.totalClasses}
                attendedClasses={course.attendedClasses}
                onDelete={deleteCourse}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Course Dialog */}
      <AddCourseDialog open={showAddDialog} onClose={() => setShowAddDialog(false)} />
    </div>
  )
}

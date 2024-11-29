// src/pages/Dashboard.tsx
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { BookOpen, Clock, Trophy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Database } from "@/types/supabase";

type CourseWithProgress = Database["public"]["Tables"]["courses"]["Row"] & {
  progress: number;
  lastLesson: Database["public"]["Tables"]["lessons"]["Row"] | null;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUserCourses() {
      if (!user?.id) return;

      try {
        const { data: userCourses, error } = await supabase
          .from("user_courses")
          .select(
            `
            course_id,
            last_watched_lesson,
            courses!inner(
              id,
              title,
              description,
              thumbnail_url
            ),
            lessons!inner(
              id,
              title
            )
          `,
          )
          .eq("user_id", user.id);

        if (error) throw error;

        // Transform data to include progress
        const coursesWithProgress = userCourses.map((uc) => {
          const totalLessons = uc.lessons?.length || 0;
          const watchedLessons = uc.last_watched_lesson
            ? uc.lessons?.findIndex((l) => l.id === uc.last_watched_lesson) + 1
            : 0;

          return {
            ...uc.courses,
            progress: (watchedLessons / totalLessons) * 100,
            lastLesson: uc.lessons?.[watchedLessons - 1] || null,
          };
        });

        setCourses(coursesWithProgress);
      } catch (error) {
        console.error("Error loading courses:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadUserCourses();
  }, [user]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Enrolled Courses
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Learning Time
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12.5h</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Courses
            </CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {courses.filter((c) => c.progress === 100).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Your Courses</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((course) => (
            <Card key={course.id}>
              <CardHeader>
                <CardTitle>{course.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {course.description && (
                  <p className="text-sm text-muted-foreground">
                    {course.description}
                  </p>
                )}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{Math.round(course.progress)}%</span>
                  </div>
                  <Progress value={course.progress} className="h-2" />
                </div>
                {course.lastLesson && (
                  <div className="text-sm text-muted-foreground">
                    Last lesson: {course.lastLesson.title}
                  </div>
                )}
                <Button asChild className="w-full mt-4">
                  <Link to={`/courses/${course.id}`}>
                    Continue Learning
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

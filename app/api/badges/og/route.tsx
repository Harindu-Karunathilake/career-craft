import { ImageResponse } from 'next/og'
import { adminDb } from "@/lib/firebase-admin"

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  const courseId = searchParams.get('courseId')

  if (!userId || !courseId) {
    return new Response('Missing userId or courseId', { status: 400 })
  }

  try {
    const db = adminDb()
    const userDoc = await db.collection("users").doc(userId).get()
    const user = userDoc.exists ? userDoc.data()! : {}
    const userName = user.name || user.displayName || "A Learner"

    let courseTitle = "Course"
    let earnedAt = new Date().toISOString()

    const badgeDoc = await db.collection(`users/${userId}/badges`).doc(courseId).get()
    if (badgeDoc.exists) {
      const data = badgeDoc.data()!
      courseTitle = data.courseTitle || courseTitle
      earnedAt = data.earnedAt || earnedAt
    } else {
      const courseDoc = await db.collection("courses").doc(courseId).get()
      const course = courseDoc.exists ? courseDoc.data() : null
      courseTitle = course ? (course.title || "Course") : "Course"
      
      const enrollments = await db.collection("enrollments")
        .where("userId", "==", userId)
        .where("courseId", "==", courseId)
        .limit(1)
        .get()
      if (!enrollments.empty) {
        earnedAt = enrollments.docs[0].data().completedAt || earnedAt
      }
    }

    const dateStr = new Date(earnedAt).toLocaleDateString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric'
    })

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: '#f8fafc',
            padding: '40px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              border: '2px solid #e2e8f0',
              padding: '60px 40px',
              width: '100%',
              height: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative',
            }}
          >
            {/* Decorative Top Banner */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '16px',
                borderTopLeftRadius: '22px',
                borderTopRightRadius: '22px',
                backgroundImage: 'linear-gradient(to right, #34d399, #14b8a6, #6366f1)',
              }}
            />

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '120px',
                height: '120px',
                backgroundColor: '#ecfdf5',
                borderRadius: '60px',
                border: '4px solid #a7f3d0',
                marginBottom: '32px',
              }}
            >
              <span style={{ fontSize: '64px' }}>🏆</span>
            </div>

            <h1
              style={{
                fontSize: '48px',
                fontWeight: 800,
                color: '#0f172a',
                marginBottom: '16px',
                fontFamily: 'sans-serif',
              }}
            >
              Certificate of Completion
            </h1>

            <p
              style={{
                fontSize: '24px',
                color: '#64748b',
                marginBottom: '16px',
              }}
            >
              This certifies that
            </p>

            <h2
              style={{
                fontSize: '56px',
                fontWeight: 800,
                color: '#059669',
                marginBottom: '24px',
                textAlign: 'center',
              }}
            >
              <u>{userName}</u>
            </h2>

            <p
              style={{
                fontSize: '24px',
                color: '#64748b',
                marginBottom: '16px',
              }}
            >
              has successfully completed the course
            </p>

            <h3
              style={{
                fontSize: '36px',
                fontWeight: 700,
                color: '#0f172a',
                marginBottom: '40px',
                textAlign: 'center',
                lineHeight: 1.2,
                padding: '0 20px',
              }}
            >
              {courseTitle}
            </h3>

            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '40px',
                marginTop: 'auto',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '18px', fontWeight: 600, color: '#475569' }}>Awarded on</span>
                <span style={{ fontSize: '20px', color: '#1e293b' }}>{dateStr}</span>
              </div>
              
              <div style={{ width: '2px', height: '40px', backgroundColor: '#e2e8f0' }} />
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '18px', fontWeight: 600, color: '#475569' }}>Credential ID</span>
                <span style={{ fontSize: '20px', color: '#1e293b', fontFamily: 'monospace' }}>{courseId.slice(0, 10).toUpperCase()}</span>
              </div>
            </div>

          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (error: any) {
    console.error("Error generating OG image:", error)
    return new Response('Failed to generate image', { status: 500 })
  }
}

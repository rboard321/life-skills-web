# Student Account Management System - Testing Guide

This guide walks you through testing the complete student account management system.

## Prerequisites

Before testing, ensure:
1. Firebase project is configured in `src/firebase.ts`
2. Firestore security rules are deployed (see Deployment section)
3. Application is running: `npm run dev`
4. You have a teacher account created

---

## Part 1: Teacher Setup & Student Creation

### Step 1: Teacher Login
1. Navigate to `/login`
2. Log in with your teacher account credentials
3. Verify you see the Teacher Dashboard

### Step 2: Create Your First Student
1. From the Teacher Dashboard, click **"Manage Content"** or navigate to `/admin`
2. Click the **"Students"** tab
3. Fill out the student creation form:
   - **First Name**: Enter student's first name (e.g., "Sarah")
   - **Last Initial**: Enter last initial (e.g., "J")
   - **Grade** (optional): Enter grade level (e.g., "3")
   - **Notes** (optional): Add any notes about the student
4. Click **"Create Student"**
5. Verify:
   - Success message appears
   - Student appears in the list below
   - A unique 6-character kid code is generated (format: ABC123)
   - Student shows as "Active"

### Step 3: Create Multiple Students
Repeat Step 2 to create 3-5 test students with different names:
- John D. (Grade 4)
- Emily R. (Grade 3)
- Marcus T. (Grade 5)
- Olivia K. (Grade 3)

### Step 4: Test Student Management Features

#### Edit Student
1. Click **"Edit"** on any student row
2. Change the grade or add notes
3. Click **"Save Changes"**
4. Verify the changes appear in the student list

#### Reset Kid Code
1. Click **"Reset Code"** on any student
2. View the modal showing old and new codes
3. Copy the new code
4. Close the modal
5. Verify the student list shows the new code

#### Deactivate/Activate Student
1. Click **"Deactivate"** on a student
2. Verify the status changes to "Inactive" and button changes to "Activate"
3. Click **"Activate"** to restore
4. Verify status returns to "Active"

---

## Part 2: Student Login & Activity Completion

### Step 5: Student Kid Login
1. **Copy a student's kid code** from the admin panel
2. Open a **new incognito/private browser window** (to test separate session)
3. Navigate to `/kid-login`
4. Verify the kid-friendly interface:
   - 6 character input boxes
   - Large, colorful design
   - Rocket emoji (🚀)
5. Enter the kid code (characters auto-uppercase)
6. Verify:
   - Auto-submit when 6 characters entered
   - Success animation appears
   - Redirects to student dashboard (`/`)

### Step 6: Assign Units to Students
Back in your teacher account:
1. Go to Teacher Dashboard
2. Scroll to **"Unit Assignments"** section
3. Click **"Assign"** on 2-3 units to make them available to students
4. Verify the units show as assigned (blue background, checkmark)

### Step 7: Student Completes an Activity
In the student's browser session:
1. Verify you see the assigned units on the dashboard
2. Click **"Start Unit"** on any unit
3. Complete the following:
   - **Video Section**: Watch the video (or skip ahead to 80%+)
   - Click **"Next: Activity"** when ready to start the activity
4. **Activity Section**:
   - Wait at least 10 seconds (progress saves every 10 seconds)
   - Click **"Mark Activity as Complete"**
   - Verify button changes to **"✓ Activity Completed!"** and is disabled
5. Navigate back to dashboard
6. Verify unit shows progress indicator

### Step 8: Test Progress Tracking (Background)
While student is on the activity page:
1. Keep the page open for 30+ seconds
2. In browser DevTools Console, verify progress saves are happening:
   - Look for messages like "Progress saved" or check Network tab for Firestore requests
3. Refresh the page
4. Verify progress is restored (activity time continues from where it was)

---

## Part 3: Teacher Progress Dashboards

### Step 9: View Individual Student Progress
Back in your teacher account:
1. Navigate to `/admin` → **Students** tab
2. Click **"View Progress"** on a student who completed an activity
3. Verify the **Student Progress Dashboard** shows:
   - Student name and kid code
   - Summary cards: Units Completed, Total Learning Time, Average Completion
   - List of units with progress details:
     - Video progress percentage
     - Activity completion status
     - Time spent on activity
     - Total time for the unit
   - Green **"✓ Completed"** badge if activity is complete

### Step 10: Test CSV Export
On the individual student progress page:
1. Click **"📊 Export CSV"** button
2. Verify a CSV file downloads with the student's name
3. Open the CSV file and verify it contains:
   - Unit ID
   - Video Completed (Yes/No)
   - Activity Completed (Yes/No)
   - Total Time
   - Completed At date

### Step 11: View Class Progress Dashboard
From Teacher Dashboard:
1. Click **"View Progress"** or navigate to `/admin/progress`
2. Verify the **Class Progress Dashboard** shows:

   **Statistics Cards:**
   - Total Students (should match number you created)
   - Active This Week (students who logged in within 7 days)
   - Average Completion % (calculated from all progress)
   - Units Completed (total across all students)
   - Total Learning Time (formatted as hours/minutes)

   **Alerts Section** (if applicable):
   - Struggling Students: Shows students with <20% completion
   - Inactive Students: Shows students who haven't logged in for >7 days

   **Student Comparison Table:**
   - All students listed with sortable columns
   - Click column headers to sort by: Name, Units Completed, Total Time, Last Active
   - Progress bars showing completion percentage
   - Color-coded progress (green >80%, yellow 50-80%, red <50%)

### Step 12: Navigate Between Dashboards
1. From Class Progress Dashboard, click **"View Details"** on any student row
2. Verify it navigates to that student's individual dashboard
3. Click **"← Back to Admin"** to return
4. Navigate to `/admin` → Students tab
5. Click **"View Progress"** on different students
6. Verify each shows their unique progress data

---

## Part 4: Multi-Student Testing

### Step 13: Test with Multiple Student Sessions
1. Log in as different students in separate browser sessions/devices:
   - Student A: Complete 1 activity fully
   - Student B: Start 2 activities but don't complete them
   - Student C: Don't complete any activities (just login)
2. Return to teacher's Class Progress Dashboard
3. Verify:
   - Different completion percentages for each student
   - Accurate time tracking for each student
   - Proper sorting when clicking column headers
   - Alert section shows Student C as struggling (0% completion)

### Step 14: Test Session Expiry
1. Log in as a student
2. Note the current timestamp
3. In Firestore Console, find the `student_sessions` collection
4. Find the session for this student
5. Manually change `expiresAt` to a past date
6. Refresh the student's browser page
7. Verify: Student is logged out and redirected to `/kid-login`

---

## Part 5: Edge Cases & Error Handling

### Step 15: Test Invalid Kid Code
1. Go to `/kid-login`
2. Enter a random 6-character code that doesn't exist (e.g., "ZZZ999")
3. Verify error message: "Invalid kid code"
4. Enter a code with less than 6 characters
5. Verify auto-submit doesn't trigger

### Step 16: Test Duplicate Names
1. Create two students with the same name: "John D."
2. Verify both are created successfully (kid codes are unique)
3. Test logging in with each student's code
4. Verify they maintain separate progress

### Step 17: Test Student Deletion
1. Create a test student
2. Have that student complete an activity (creates progress records)
3. Return to admin panel
4. Click **"Delete"** on that student
5. Confirm deletion in the modal
6. Verify:
   - Student is removed from the list
   - In Firestore Console, check that:
     - Student document is deleted
     - Student's progress records are deleted (cascade delete)
     - Student's session is deleted

### Step 18: Test With No Assigned Units
1. Log in as a teacher
2. Remove all unit assignments (click "Remove" on all assigned units)
3. Log in as a student in another session
4. Verify: Dashboard shows "No units assigned" or empty state message

### Step 19: Test Progress Without Student Login
1. As a teacher, view the Class Progress Dashboard
2. Find a student who has never logged in
3. Verify:
   - Last Active shows "Never" or the created date
   - Shows 0 units completed
   - Shows 0 total time
   - Appears in "Inactive Students" alert if >7 days old

---

## Part 6: Performance & Data Verification

### Step 20: Verify Firestore Data Structure
Open Firebase Console → Firestore Database and verify collections:

**`students` collection:**
- Document ID is auto-generated
- Contains: `studentId`, `kidCode`, `firstName`, `lastInitial`, `displayName`, `teacherId`, `isActive`, `createdAt`, `updatedAt`, `lastActiveAt`
- `kidCode` is unique across all documents

**`student_progress` collection:**
- Document ID format: `{studentId}_{unitId}`
- Contains: `studentId`, `unitId`, `teacherId`, activity tracking fields, activity score fields, `isCompleted`, `totalTimeSeconds`, timestamps

**`student_sessions` collection:**
- Contains: `studentId`, `kidCode`, `teacherId`, `sessionToken`, `createdAt`, `expiresAt`, `lastActivityAt`
- `expiresAt` is 7 days from `createdAt`

### Step 21: Test Progress Save Frequency
1. Log in as a student
2. Open browser DevTools → Network tab
3. Filter for Firestore requests
4. Start an activity and wait
5. Verify Firestore writes occur approximately every 10 seconds (debounced saves)
6. Complete the activity
7. Verify a final save occurs on activity completion

### Step 22: Test Teacher Quick Stats
On Teacher Dashboard:
1. Verify **"Total Students"** card shows correct count with link to manage students
2. Verify **"Active This Week"** shows students who logged in within 7 days
3. Verify **"Avg Completion"** percentage is calculated correctly
4. Verify **"Units Completed"** matches sum from Class Progress Dashboard
5. Click **"Manage Students →"** link
6. Verify it navigates to `/admin?tab=students`

---

## Part 7: Firebase Deployment

### Step 23: Deploy Firestore Rules
1. Install Firebase CLI if not already: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Initialize Firebase (if not done): `firebase init firestore`
   - Select your Firebase project
   - Accept default `firestore.rules` and `firestore.indexes.json`
4. Deploy rules and indexes:
   ```bash
   firebase deploy --only firestore:rules
   firebase deploy --only firestore:indexes
   ```
5. Verify in Firebase Console → Firestore → Rules that new rules are active
6. Verify in Firebase Console → Firestore → Indexes that new indexes are created

### Step 24: Test Security Rules
After deploying rules, test security:

**Test 1: Teacher can only read their own students**
- In Firestore Console, manually create a student with a different teacherId
- Try to view that student in your admin panel
- Verify: Student does not appear (security rules block access)

**Test 2: Progress writes work without Firebase auth**
- Log in as a student (session-based, no Firebase auth)
- Complete an activity
- Verify: Progress saves successfully to Firestore
- This confirms `allow write: if true` works for `student_progress`

**Test 3: Teachers can read their students' progress**
- Log in as a teacher
- View Class Progress Dashboard
- Verify: Only progress for your students is visible
- In Firestore Console, manually create progress with different teacherId
- Verify: It doesn't appear in your dashboard

---

## Troubleshooting Common Issues

### Issue: "Permission denied" when creating students
**Solution:** Deploy Firestore rules with `firebase deploy --only firestore:rules`

### Issue: Kid codes are not unique
**Solution:** Check Firestore for duplicate `kidCode` values. The generator retries up to 10 times but with 17M+ combinations, collisions are extremely rare. If this happens, delete duplicates and create student again.

### Issue: Progress not saving
**Solution:**
- Check browser console for errors
- Verify student is logged in (check sessionStorage for `studentSessionToken`)
- Verify Firestore rules allow writes to `student_progress`
- Check Network tab for failed Firestore requests

### Issue: Student stays logged in forever
**Solution:** Sessions expire after 7 days. To manually expire, find the session in Firestore and update `expiresAt` to a past date, then refresh the student's browser.

### Issue: Class statistics show 0 for everything
**Solution:**
- Verify students have completed activities
- Check that progress documents exist in Firestore with `teacherId` matching your teacher account
- Verify students are marked as `isActive: true`

### Issue: Indexes not created
**Solution:**
- Deploy indexes: `firebase deploy --only firestore:indexes`
- Wait 5-10 minutes for indexes to build
- Check Firebase Console → Firestore → Indexes for build status

---

## Success Checklist

After completing all tests, verify:
- ✅ Teachers can create students with first name + last initial
- ✅ Unique 6-character kid codes are generated
- ✅ Students can login with kid codes only
- ✅ Students can complete activities
- ✅ Activity completion is tracked and persisted
- ✅ Time spent on activities is tracked accurately
- ✅ Individual student progress dashboard works
- ✅ Class progress dashboard shows aggregate statistics
- ✅ CSV export works for individual students
- ✅ Teachers can edit student information
- ✅ Teachers can reset kid codes
- ✅ Teachers can delete/deactivate students
- ✅ Progress saves automatically every 10 seconds
- ✅ Sessions expire after 7 days
- ✅ Firestore security rules are deployed and working
- ✅ Firestore indexes are created and active

---

## Next Steps

Once testing is complete and successful:
1. **Production Deployment**: Deploy to your hosting platform (Firebase Hosting, Vercel, etc.)
2. **Bulk Import**: Implement CSV import for adding many students at once
3. **Printable Codes**: Create printable kid code cards for classroom distribution
4. **Parent Portal**: Consider adding view-only access for parents
5. **Reporting**: Add more detailed reports and analytics
6. **Backup**: Set up regular Firestore backups

---

## Support & Feedback

If you encounter issues during testing:
1. Check the browser console for JavaScript errors
2. Check the Network tab for failed API requests
3. Verify Firestore rules are deployed correctly
4. Check that all required npm packages are installed
5. Ensure Firebase configuration in `src/firebase.ts` is correct

For feature requests or bug reports, document:
- Steps to reproduce the issue
- Expected vs actual behavior
- Browser and device information
- Screenshots or error messages

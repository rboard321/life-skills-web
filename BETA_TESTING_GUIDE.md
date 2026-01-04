# Beta Testing Guide - Life Skills Learning Platform

Welcome to the Life Skills Learning Platform beta! Thank you for helping us test and improve the application.

## Table of Contents
1. [Getting Started](#getting-started)
2. [Teacher Quick Start](#teacher-quick-start)
3. [Student Quick Start](#student-quick-start)
4. [Features to Test](#features-to-test)
5. [Known Issues & Limitations](#known-issues--limitations)
6. [How to Report Issues](#how-to-report-issues)

---

## Getting Started

### What to Expect During Beta
- You're testing a **work-in-progress** application
- Some features may have bugs or unexpected behavior
- Your feedback will directly improve the final product
- We appreciate your patience and detailed feedback

### Application URL
**Production:** [Your Vercel URL will be provided]

### Who Should Test?
- **Teachers**: Create accounts, manage students, assign units, track progress
- **Students**: Login with kid codes, complete activities, test the learning experience
- **Parents**: (Optional) Observe student experience and provide feedback

---

## Teacher Quick Start

### 1. Create Your Teacher Account
1. Go to the application URL
2. Click **"Create a teacher account"** on the login page
3. Fill in your details:
   - **Name**: Your display name (e.g., "Ms. Smith")
   - **Email**: Your email address
   - **Password**: At least 6 characters
   - **Confirm Password**: Re-enter your password
4. Click **"Create Account"**

### 2. Log In to Your Dashboard
1. After signup, you'll be redirected to your dashboard
2. Or go to the app URL and click **"Sign in"**
3. Enter your email and password

### 3. Create Your First Student
1. Click **"Manage Content"** or go to the **Admin** section
2. Click the **"Students"** tab
3. Fill out the student form:
   - **First Name**: Student's first name (e.g., "John")
   - **Last Initial**: Student's last initial (e.g., "D")
   - **Grade** (optional): e.g., "3", "4th", "Fifth"
   - **Notes** (optional): Any information about the student
4. Click **"Create Student"**
5. **Save the 6-character Kid Code** displayed (e.g., XYZ456)
   - This is how the student will log in
   - You can view it anytime in the student list

**Tip**: Create 3-5 test students to explore all features

### 4. Bulk Import Students (Optional)
1. In the **Students** tab, find the **"Bulk Import from CSV"** section
2. Click **"Download CSV Template"** to get the format
3. Fill in the template with your students:
   ```csv
   firstName,lastInitial,grade,notes
   John,D,3,Great student
   Sarah,M,4,Needs extra help
   ```
4. Click **"Import Students from CSV"**
5. Review the import results modal showing success/failures
6. Download the generated kid codes as CSV

### 5. Assign Units to Students
1. From your dashboard, scroll to **"Unit Assignments"**
2. Click **"Assign"** on units you want students to access
3. Assigned units will appear for all your students
4. Click **"Remove"** to unassign a unit

### 6. Track Student Progress
- **Individual Student Progress**:
  1. Go to Admin → Students tab
  2. Click **"View Progress"** next to a student name
  3. See detailed progress: units completed, time spent, activity completion
  4. Click **"Export CSV"** to download their data

- **Class Progress Dashboard**:
  1. Click **"View Progress"** from the teacher dashboard
  2. See aggregate statistics for your entire class
  3. View alerts for struggling or inactive students
  4. Sort students by completion, time, or last active

---

## Student Quick Start

### 1. Get Your Kid Code
- Ask your teacher for your 6-character Kid Code (e.g., XYZ456)
- Write it down or save it somewhere safe

### 2. Login
1. Go to the application URL
2. Click **"Student login"** at the bottom
3. Enter your 6-character kid code (one letter/number per box)
   - Characters will automatically capitalize
   - The code will auto-submit when all 6 characters are entered
4. You'll see your assigned units

### 3. Complete an Activity
1. Click **"Start Unit"** on an assigned unit
2. **Watch the video** (if available):
   - Progress is tracked automatically
   - You can pause and resume
3. Click **"Next: Activity"** to proceed
4. **Complete the activity**:
   - Interactive content will load
   - Take your time to complete it
   - Your progress is saved every 10 seconds
5. Click **"Mark Activity as Complete"** when done
6. Return to dashboard to see your progress

### 4. Track Your Own Progress
- See completion percentage on each unit card
- View time spent on activities
- Check which units you've completed

---

## Features to Test

### Core Flows ✅

Please test these main workflows and report any issues:

#### Teacher Features
- [ ] **Teacher Signup**: Create a new teacher account
  - Verify auto-redirect to dashboard
- [ ] **Teacher Login**: Log in with email and password
  - Test with correct credentials
  - Test with incorrect credentials
  - Verify error messages
- [ ] **Forgot Password**: Request password reset
  - Enter email and receive reset link
  - Check if reset email arrives
  - Test reset link functionality
- [ ] **Create Students**:
  - Individual student creation
  - Bulk CSV import
  - Verify kid codes are unique
  - Verify student appears in list
- [ ] **Edit Students**:
  - Change student name
  - Update grade
  - Add/edit notes
- [ ] **Reset Kid Codes**:
  - Generate new code
  - Verify old code shown
  - Verify new code works for login
- [ ] **Deactivate/Delete Students**:
  - Deactivate student (soft delete)
  - Reactivate student
  - Permanently delete student
- [ ] **Assign Units**:
  - Assign units to class
  - Remove unit assignment
  - Verify students see assigned units
- [ ] **View Individual Progress**:
  - Open student progress dashboard
  - Verify accurate data (units, time, completion)
  - Export CSV
- [ ] **View Class Progress**:
  - Check class statistics are accurate
  - View struggling students alert
  - View inactive students alert
  - Sort student table by different columns
  - Click student row to view details

#### Student Features
- [ ] **Kid Code Login**:
  - Enter valid 6-character code
  - Test invalid code
  - Test uppercase/lowercase (should work)
  - Verify auto-submit
- [ ] **View Assigned Units**:
  - See only units assigned by teacher
  - Verify units display correctly
- [ ] **Complete Activities**:
  - Start a unit
  - Watch video (if available)
  - Access activity
  - Mark activity as complete
  - Verify progress saves
- [ ] **Progress Tracking**:
  - View completion percentage on units
  - See time spent
  - Verify completed badge shows
- [ ] **Session Persistence**:
  - Refresh page and stay logged in
  - Close browser and reopen (should stay logged in for 7 days)

### Edge Cases 🔍

Test these special scenarios:

- [ ] **Invalid Kid Code**: Enter random 6 characters that don't exist
- [ ] **Duplicate Student Names**: Create two students named "John D."
  - Verify both work with different kid codes
- [ ] **Teacher with No Students**: View dashboard without creating students
- [ ] **Student with No Units**: Login as student with no assigned units
- [ ] **Session Expiry**: (Hard to test - expires after 7 days)
  - If possible, manually change session expiry in Firestore
  - Verify student is logged out and redirected
- [ ] **Password Too Short**: Try creating account with password < 6 characters
- [ ] **Email Already in Use**: Try signing up with same email twice
- [ ] **CSV Import Errors**: Upload CSV with missing required fields
- [ ] **Large Class Sizes**: Test with 20+ students
  - Performance of dashboards
  - CSV import/export speed

---

## Known Issues & Limitations

### Current Limitations
1. **Session Duration**: Student sessions expire after 7 days. Students will need to re-login.
2. **Progress Save Frequency**: Activity progress saves every 10 seconds, not in real-time.
3. **Video Progress**: Video completion tracking is disabled (focus is on activity completion).
4. **CSV Format**: Bulk import requires exact CSV format (use provided template).
5. **No Email Notifications**: Teachers/students don't receive email notifications for events.
6. **No Parent Portal**: Parents cannot view student progress (teacher-only feature).
7. **Kid Codes Can Be Reset**: Teachers can reset kid codes from the Students list.

### Expected Behaviors (Not Bugs)
- Students can have the same name if they're in the same class (kid codes differentiate them)
- Progress saves every 10 seconds (you may need to wait before refreshing)
- Kid codes are case-insensitive
- Deleted students' progress is permanently removed (use deactivate for soft delete)

---

## How to Report Issues

### What to Include in Bug Reports
When you find a bug or unexpected behavior, please include:

1. **Description**: What happened vs. what you expected
2. **Steps to Reproduce**:
   - Step 1: ...
   - Step 2: ...
   - Step 3: ...
3. **Browser & Device**:
   - Browser: Chrome 120 on Windows 11
   - Device: Desktop / Tablet / Mobile
4. **Screenshots**: Attach screenshots if visual
5. **Error Messages**: Copy any error text that appeared
6. **Account Details** (if relevant):
   - Teacher code or kid code (so we can investigate)
   - Student ID (from URL if viewing progress)

### Where to Send Feedback

**Option 1: Email**
Send detailed bug reports and feedback to: [Your Email Address]

**Option 2: GitHub Issues** (if applicable)
Create an issue at: [GitHub Repo URL]

**Option 3: Feedback Form** (if you create one)
Fill out our feedback form: [Form URL]

### What to Test For

**Functionality**: Does the feature work as expected?
**Usability**: Is it easy to use? Confusing? Clear?
**Performance**: Is it fast? Slow? Laggy?
**Accessibility**: Can you use it on different devices? Screen sizes?
**Data Accuracy**: Are statistics and progress tracking correct?

---

## Beta Testing Timeline

**Beta Period**: [Your Start Date] - [Your End Date]

**Milestones**:
- Week 1: Teacher signup, student creation, unit assignment
- Week 2: Student login, activity completion, basic progress tracking
- Week 3: Full testing of all features, edge cases, bulk operations
- Week 4: Final feedback, bug fixes, preparation for launch

**Survey**: At the end of beta, please fill out our feedback survey (link will be provided)

---

## Frequently Asked Questions

### For Teachers

**Q: Can I change a student’s kid code?**
A: Yes, teachers can reset kid codes from the Students list.

**Q: Can I have multiple classes?**
A: Currently, each teacher account has one class. All students you create belong to your class.

**Q: What happens if I delete a student?**
A: Deletion is permanent and removes all progress data. Use "Deactivate" if you want to temporarily hide a student.

**Q: Can students see each other's progress?**
A: No, students only see their own assigned units and progress.

**Q: How do I add more units?**
A: Units are created in the Admin panel. You can create custom units or use units from the global library.

### For Students

**Q: I forgot my kid code. How do I get it?**
A: Ask your teacher to look it up in the Students list in their admin panel.

**Q: Can I change my kid code?**
A: Only your teacher can reset your code, which will generate a new one.

**Q: Will my progress save if I close the browser?**
A: Yes! Your session lasts 7 days, and progress is saved every 10 seconds.

**Q: Can I access the app from home?**
A: Yes, as long as you have your kid code, you can access the app from any device with internet.

---

## Thank You!

Your participation in this beta test is invaluable. Your feedback will help us create a better learning experience for students everywhere.

**Questions or Need Help?**
Contact us at: [Your Support Email/Phone]

Happy Testing! 🎓✨

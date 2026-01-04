# Deployment Guide - Student Account Management System

This guide covers deploying your life skills learning application with the new student account management system.

---

## Prerequisites

Before deploying, ensure you have:
1. A Firebase project created ([console.firebase.google.com](https://console.firebase.google.com))
2. Node.js and npm installed
3. Git installed (for version control)
4. Firebase CLI installed globally: `npm install -g firebase-tools`

---

## Part 1: Firebase Configuration

### Step 1: Install Firebase CLI
```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase
```bash
firebase login
```
This will open a browser window for authentication.

### Step 3: Initialize Firebase (if not already done)
```bash
firebase init
```

Select the following options:
- **Features**: Firestore, Hosting (optional)
- **Project**: Select your existing Firebase project
- **Firestore Rules**: Use `firestore.rules` (already configured)
- **Firestore Indexes**: Use `firestore.indexes.json` (already configured)
- **Hosting** (if selected):
  - Public directory: `dist`
  - Single-page app: `Yes`
  - GitHub Actions: `No` (unless you want CI/CD)

### Step 4: Review Firebase Configuration Files

The project already has these files configured:

**`firebase.json`:**
```json
{
  "firestore": {
    "database": "(default)",
    "location": "nam5",
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

**`firestore.rules`:** Contains security rules for:
- `students` collection (teacher-only access)
- `student_sessions` collection (public for session validation)
- `student_progress` collection (teachers read, public write)
- Other existing collections

**`firestore.indexes.json`:** Contains composite indexes for efficient queries on:
- `students` by `teacherId` and `isActive`
- `students` by `kidCode`
- `student_progress` by `studentId` and `unitId`
- `student_progress` by `teacherId` and `isCompleted`

---

## Part 2: Deploy Firestore Rules & Indexes

### Step 5: Deploy Security Rules
```bash
firebase deploy --only firestore:rules
```

Verify deployment:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Navigate to your project → Firestore Database → Rules
3. Confirm the rules match `firestore.rules` file
4. Check the "Published" timestamp

### Step 6: Deploy Firestore Indexes
```bash
firebase deploy --only firestore:indexes
```

**Important:** Index creation can take 5-15 minutes for large databases.

Monitor index status:
1. Go to Firebase Console → Firestore Database → Indexes
2. Check for these indexes:
   - `students` composite index (teacherId, isActive)
   - `students` single index (kidCode)
   - `student_progress` composite index (studentId, unitId)
   - `student_progress` composite index (teacherId, isCompleted)
3. Wait for all indexes to show "Enabled" status (green checkmark)

### Step 7: Verify Firestore Configuration
```bash
firebase firestore:databases:list
```

Expected output:
```
┌──────────┬──────────────────┬────────────────┬─────────┐
│ Database │ Location         │ Type           │ State   │
├──────────┼──────────────────┼────────────────┼─────────┤
│ (default)│ nam5             │ FIRESTORE_NATIVE│ ACTIVE  │
└──────────┴──────────────────┴────────────────┴─────────┘
```

---

## Part 3: Build & Deploy Application

### Step 8: Install Dependencies
```bash
npm install
```

### Step 9: Build Production Bundle
```bash
npm run build
```

Expected output:
```
✓ X modules transformed.
dist/index.html                   0.XX kB
dist/assets/index-XXXXX.css      XX.XX kB
dist/assets/index-XXXXX.js      XXX.XX kB
✓ built in X.XXs
```

Verify the `dist/` folder was created with:
- `index.html`
- `assets/` folder with CSS and JS bundles

### Step 10: Test Production Build Locally
```bash
npm run preview
```

Navigate to `http://localhost:4173` and test:
- Teacher login
- Student creation
- Kid login
- Activity completion
- Progress dashboards

### Step 11: Deploy to Hosting Platform

Choose one of the following deployment options:

#### Option A: Firebase Hosting (Recommended)

1. **Add Hosting to firebase.json** (if not already configured):
```bash
firebase init hosting
```
- Public directory: `dist`
- Single-page app: `Yes`
- Overwrite files: `No`

2. **Deploy to Firebase Hosting:**
```bash
firebase deploy --only hosting
```

3. **Verify deployment:**
```
✔ Deploy complete!

Project Console: https://console.firebase.google.com/project/YOUR_PROJECT
Hosting URL: https://YOUR_PROJECT.web.app
```

4. **Visit your deployed app:** Navigate to the Hosting URL

#### Option B: Vercel

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Deploy:**
```bash
vercel
```

Follow prompts:
- Link to existing project or create new
- Build command: `npm run build`
- Output directory: `dist`

3. **Set environment variables in Vercel dashboard** (if using .env):
- Go to Vercel dashboard → Your project → Settings → Environment Variables
- Add all Firebase config variables from `.env`

#### Option C: Netlify

1. **Install Netlify CLI:**
```bash
npm install -g netlify-cli
```

2. **Deploy:**
```bash
netlify deploy --prod
```

Follow prompts:
- Publish directory: `dist`

3. **Set environment variables in Netlify dashboard** (if using .env):
- Go to Netlify dashboard → Site settings → Environment variables
- Add all Firebase config variables

#### Option D: Custom Server

1. **Copy `dist/` folder to your server:**
```bash
scp -r dist/ user@your-server:/var/www/your-app/
```

2. **Configure web server (Nginx example):**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/your-app/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

3. **Restart web server:**
```bash
sudo systemctl restart nginx
```

---

## Part 4: Environment Configuration

### Step 12: Set Up Environment Variables

If using environment variables for Firebase config:

**Development (.env.local):**
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

**Production:**
Set these in your hosting platform's environment variables dashboard.

**Update `src/firebase.ts`** to use environment variables:
```typescript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
```

---

## Part 5: Post-Deployment Verification

### Step 13: Test Production Environment

Visit your deployed application and verify:

**✅ Teacher Features:**
1. Teacher can log in
2. Teacher dashboard loads
3. Can create students in admin panel
4. Can view/edit/delete students
5. Can assign units to students
6. Can view Class Progress Dashboard
7. Can view Individual Student Progress Dashboard

**✅ Student Features:**
1. Kid login page loads
2. Students can log in with kid codes
3. Assigned units appear on student dashboard
4. Students can complete activities
5. Progress saves automatically
6. Session persists across page refreshes

**✅ Performance:**
1. Page loads in < 3 seconds
2. No console errors
3. Progress saves work (check Network tab)
4. Firestore queries are fast

### Step 14: Monitor Firestore Usage

1. Go to Firebase Console → Firestore Database → Usage
2. Monitor:
   - Document reads (should be reasonable for your user count)
   - Document writes (expect writes every 10 seconds during activity completion)
   - Storage size (increases with students and progress)
3. Set up billing alerts if on paid plan

### Step 15: Configure Firebase Authentication Settings

1. Go to Firebase Console → Authentication → Settings
2. **Authorized domains**: Add your production domain
   - Example: `your-app.web.app`, `your-domain.com`
3. **Email/Password provider**: Ensure it's enabled for teacher login

---

## Part 6: Continuous Deployment (Optional)

### Option: GitHub Actions + Firebase Hosting

Create `.github/workflows/firebase-deploy.yml`:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches:
      - main

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: your-project-id
```

**Setup:**
1. Generate Firebase service account key:
   - Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
2. Add to GitHub Secrets:
   - GitHub repo → Settings → Secrets → New repository secret
   - Name: `FIREBASE_SERVICE_ACCOUNT`
   - Value: Paste JSON key content

---

## Part 7: Maintenance & Updates

### Deploying Updates

1. **Make code changes**
2. **Test locally:**
   ```bash
   npm run dev
   ```
3. **Build:**
   ```bash
   npm run build
   ```
4. **Test production build:**
   ```bash
   npm run preview
   ```
5. **Deploy:**
   ```bash
   firebase deploy --only hosting
   # or your chosen platform's deploy command
   ```

### Updating Firestore Rules

1. Edit `firestore.rules`
2. Test rules locally (optional):
   ```bash
   firebase emulators:start --only firestore
   ```
3. Deploy:
   ```bash
   firebase deploy --only firestore:rules
   ```

### Adding Firestore Indexes

1. Edit `firestore.indexes.json`
2. Deploy:
   ```bash
   firebase deploy --only firestore:indexes
   ```
3. Wait 5-15 minutes for indexes to build

---

## Troubleshooting Deployment Issues

### Issue: "Permission denied" errors in production
**Solution:**
- Verify Firestore rules are deployed: `firebase deploy --only firestore:rules`
- Check Firebase Console → Firestore → Rules for correct rules
- Ensure teacher user has `role: 'teacher'` in `users` collection

### Issue: Indexes not working (slow queries)
**Solution:**
- Deploy indexes: `firebase deploy --only firestore:indexes`
- Wait 10-15 minutes for indexes to build
- Check Firebase Console → Firestore → Indexes for "Enabled" status
- If "Error" status, delete and redeploy indexes

### Issue: Firebase configuration errors
**Solution:**
- Verify `src/firebase.ts` has correct project credentials
- Check Firebase Console → Project Settings → General for correct values
- Ensure authorized domains include your production domain

### Issue: 404 errors on refresh (SPA routing)
**Solution:**
- Ensure hosting is configured as single-page app
- Firebase: `"rewrites": [{"source": "**", "destination": "/index.html"}]` in firebase.json
- Nginx: `try_files $uri $uri/ /index.html;`

### Issue: Build fails with "out of memory"
**Solution:**
```bash
NODE_OPTIONS=--max_old_space_size=4096 npm run build
```

### Issue: Environment variables not working
**Solution:**
- Ensure variables start with `VITE_` prefix
- Set in hosting platform's dashboard
- Rebuild and redeploy after setting variables

---

## Security Checklist

Before going live:
- ✅ Firestore security rules are deployed
- ✅ Firestore indexes are created and enabled
- ✅ Firebase Authentication has authorized domains configured
- ✅ API keys are not exposed in public repositories (use .env)
- ✅ HTTPS is enabled (automatic on Firebase Hosting, Vercel, Netlify)
- ✅ Test with real student/teacher accounts
- ✅ Monitor Firestore usage to avoid unexpected costs

---

## Performance Optimization

### Enable Caching
Add to `firebase.json` (if using Firebase Hosting):
```json
{
  "hosting": {
    "public": "dist",
    "headers": [
      {
        "source": "/assets/**",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      }
    ]
  }
}
```

### Optimize Bundle Size
Current warnings about large chunks can be addressed:
1. Implement code splitting (dynamic imports)
2. Lazy load routes
3. Tree-shake unused dependencies

### Monitor Performance
- Set up Firebase Performance Monitoring
- Use Lighthouse for performance audits
- Monitor Core Web Vitals

---

## Backup & Recovery

### Automated Firestore Backups
```bash
gcloud firestore export gs://your-bucket-name/backups
```

Set up scheduled backups:
1. Create Cloud Storage bucket
2. Set up Cloud Scheduler to run exports daily
3. Configure retention policy

### Manual Backup
1. Firebase Console → Firestore → Import/Export
2. Export to Cloud Storage bucket
3. Download backup locally if needed

---

## Support & Resources

- **Firebase Docs**: [firebase.google.com/docs](https://firebase.google.com/docs)
- **Vite Docs**: [vitejs.dev/guide](https://vitejs.dev/guide/)
- **React Router Docs**: [reactrouter.com](https://reactrouter.com)
- **Tailwind CSS Docs**: [tailwindcss.com/docs](https://tailwindcss.com/docs)

---

## Next Steps

After successful deployment:
1. ✅ Complete the TESTING.md guide to verify all features
2. ✅ Implement bulk student import (CSV)
3. ✅ Add printable kid code cards
4. ✅ Set up monitoring and alerts
5. ✅ Plan for scalability (if expecting high usage)
6. ✅ Consider adding analytics (Google Analytics, Mixpanel, etc.)

Your application is now live and ready for students! 🎉

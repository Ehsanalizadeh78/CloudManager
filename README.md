
# Cloud Manager

A simple React-based cloud file management app integrated with Supabase for authentication and file storage.
Allows users to sign up, log in, upload files, rename, delete, and track storage usage in real time.

## Features

* User authentication (email/password) with Supabase
* File upload to user-specific folders in Supabase Storage
* File listing with preview for images and file format icons
* Rename and delete files
* Storage usage display with progress bar
* Responsive UI with modal upload dialog
* File search and filtering by file type
* Local storage of logged-in user session

## Technologies

* React
* Supabase (Auth & Storage)
* CSS for styling

## Getting Started

### Prerequisites

* Node.js and npm installed
* Supabase project with Auth and Storage enabled
* Supabase client configured in `supabaseClient.js`

### Installation

1. Clone the repository:

```bash
git clone https://github.com/Ehsanalizadeh78/CloudManager.git
cd CloudManager
```

2. Install dependencies:

```bash
npm install
```

3. Configure Supabase client:

Create or edit `supabaseClient.js` with your Supabase project URL and anon key:

```js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-project.supabase.co';
const supabaseAnonKey = 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

4. Start the development server:

```bash
npm start -- --host 0.0.0.0
```

You can now access the app from your local network at:
`http://<your-computer-ip>:3000`

## Usage

* Sign up or log in with your email and password
* Upload files via the "+" button
* Manage files: rename, delete, filter, and search
* Monitor your storage usage in the dashboard

## Notes

* User email confirmation is required before first login (check your email after sign up)
* Uploaded files are stored under each user's folder in the Supabase Storage bucket named `"uploads"`
* Maximum storage limit is set to 1 GB (can be changed in the code)

## License

This project is licensed under the MIT License.



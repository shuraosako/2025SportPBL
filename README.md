# SportsPBL
![image](https://github.com/user-attachments/assets/65a6f7e2-39b2-45fc-9f36-50c43b149ade)

## 📝 Project Overview
SportsPBL is a web application designed for managing and analyzing baseball player data. It enables coaches and staff to track player performance and make data-driven decisions.

## ✨ Key Features
- Player profile management (height, weight, grade, etc.)
- Advanced search and filtering capabilities
- Real-time data updates using Firebase
- Responsive design
- Rapsodo data integration (not yet implemented)
- Player comparison tools
- Calendar-based schedule management

## 🔧 Technology Stack
### Core Technologies
- **Frontend**: Next.js 14
- **Backend/Database**: Firebase
- **State Management**: React Hooks
- **Styling**: TailwindCSS
- **Language**: TypeScript

### Requirements
- Node.js 18.17.0 or higher
- npm 9.0.0 or higher, or Yarn 1.22.0 or higher
- Firebase account

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/sports-pbl.git
cd sports-pbl
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables (Optional)
The application comes with default Firebase configuration for development purposes.
If you need to use your own Firebase project, create an `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Then edit `.env.local` with your Firebase credentials. If you don't create this file, the application will use the default development configuration.

### 4. Start Development Server
```bash
npm run dev
```
Access the application at http://localhost:3000

## 📁 Project Structure
```
sports-pbl/
├── app/                    # Next.js application main directory
│   ├── create_player/     # Player creation page
│   │   └── page.tsx      
│   ├── home/             # Homepage
│   │   └── page.tsx
│   ├── login/            # Login page
│   │   └── page.tsx
│   ├── profile/          # Profile page
│   │   └── page.tsx
│   ├── favicon.ico      
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Top page
│
├── components/           # Shared components
│   └── Header.tsx       # Header component
│
├── public/              # Static files
│   └── next.svg
│
├── .env.local           # Environment variables (needs to be created)
├── package.json         # Project configuration and package management
├── tsconfig.json        # TypeScript configuration
└── README.md           # Project documentation
```

## 📋 Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm run start` - Run production server
- `npm run lint` - Run code quality checks

## 🔒 Security
- Authentication using Firebase Authentication
- Environment variable management for sensitive information
- Access control through role-based permissions

## 📱 Supported Browsers
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 💻 Recommended Development Environment
- VS Code
  - ESLint extension
  - Prettier extension
  - Tailwind CSS IntelliSense extension

## 🚀 Deployment
1. Create a Vercel account
2. Connect with GitHub repository
3. Configure environment variables
4. Execute deployment

## 🤝 Contribution
1. Fork the repository
2. Create a new branch (`git checkout -b amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin HEAD`)
5. Create a Pull Request

## 📝 License
This project is released under the MIT License.

## 👥 Development Team
### Leader
- 22m1054 Kawahara Issei

### Members
- 22m1153 Nihonyanagi Haruhito
- 22m1125 Hurukawa Kaito
- 22m1098 Hamasaki Rui

### Support
- 21m1012 Osako Shura
- Temasek Polytechnic Randal Gay Ming Jie

---
©️ 2024 SportsPBL Team. All Rights Reserved.
# Vibe-Match App

## Overview

Vibe-Match is a React Native mobile application designed for social matching based on user profiles and vibes. The app includes features such as user authentication, profile creation, and swipe functionality to find potential matches.

## Features

- **User Authentication**: Users can sign up and log in using email and password.
- **Profile Creation**: Users can create and customize their profiles, including uploading profile pictures and adding bios.
- **Swipe Functionality**: Users can swipe left or right on profiles to indicate interest.
- **Dynamic Navigation**: The app uses Expo Router for seamless navigation between screens.
- **Responsive Design**: The app is designed to work on both iOS and Android devices.

## Technologies Used

- **React Native**: Framework for building the mobile application.
- **Expo**: Toolchain for React Native that simplifies development.
- **Supabase**: Backend as a service for authentication and database management.
- **React Query**: For data fetching and caching.
- **Expo Router**: For managing navigation within the app.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/vibe-match.git
   cd vibe-match
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Create a `.env` file in the root directory and add your Supabase URL and API keys.
4. Run the app:
   ```bash
   expo start
   ```

## Usage

- Upon launching the app, users will be presented with a welcome screen.
- Users can navigate to the authentication screen to sign up or log in.
- After logging in, users can create their profiles and start swiping through potential matches.

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for discussion.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

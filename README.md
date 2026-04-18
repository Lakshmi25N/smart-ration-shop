TNRation – Smart Ration Shop Management System

📌 Overview
TNRation is a web-based application designed to simulate and manage the workflow of a ration shop. It provides real-time updates on shop status, token system, queue management, and item availability for customers.
This project improves transparency and reduces waiting time by digitizing the traditional ration distribution process.

🚀 Features
🕒 Live Shop Status
Automatically updates:
Open
Lunch Break
Closed
⏳ Dynamic Timer
Countdown during lunch break (till 2:00 PM)
Countdown to closing time (6:00 PM)
🎟️ Token System
Displays current token number
Shows people in queue
📊 Dashboard
Current serving token
Waiting queue count
Completed tokens
📢 Announcements Section
Displays important shop updates
🔗 Quick Links
Easy navigation to items and complaints

🛠️ Technologies Used
HTML – Structure of the web page
CSS – Styling and layout
JavaScript – Dynamic behavior and timer logic

📂 Project Structure
TNRation/
│── index.html
│── style.css
│── script.js
│── assets/

⚙️ How It Works
The system uses JavaScript Date() to track real-time.
Based on time:
9 AM – 1 PM → Open
1 PM – 2 PM → Lunch Break
2 PM – 6 PM → Open
After 6 PM → Closed
Timer updates automatically every second.

▶️ How to Run
Download or clone the repository
Open the project folder
Run index.html in your browser

📈 Future Improvements
🔐 Login system for users
📱 Fully responsive mobile design
☁️ Backend integration (Node.js / Firebase)
🗄️ Database for storing tokens
📊 Admin dashboard

🎯 Purpose
This project is built as a learning-based mini project to understand:
Real-time UI updates
JavaScript timing functions
Frontend development concepts


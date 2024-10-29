My project is a gadget import website focused on managing various aspects of phone sales, including customer profiles, reservations, product inventory, and order processing. The system is designed for seamless user experience and efficient management of sales and customer data, enhancing both functionality and security.

Technologies Used
Frontend: Built using Next.js for a fast, responsive interface. The Next.js API Router handles backend logic, enabling smooth interactions between the client and server.
Database: Uses Prisma ORM for structured database interaction, interfacing with MongoDB to ensure flexible and scalable data storage.
Authentication and Security: Employs NextAuth for secure authentication, enabling both first-party and third-party login options.
Data Validation: Zod is integrated for robust input validation, ensuring data accuracy and security.
Image Management: Utilizes Cloudinary, a third-party service, to efficiently store and serve images, reducing server load and improving site performance.
Configuration: Environment variables provide a secure and customizable setup, managing sensitive information like API keys and database connections.

Key Features
Product Management: Comprehensive management of phone inventories, including categorization, descriptions, and image support.
Customer Management: Detailed customer profiles that streamline tracking, communication, and engagement.
Reservation System: Allows users to reserve products, with automated notifications and reminders.
Order Management: Tracks orders from placement to fulfillment, with real-time status updates for users.

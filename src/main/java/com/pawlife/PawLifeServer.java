package com.pawlife;

import com.sun.net.httpserver.HttpServer;

import java.net.InetSocketAddress;
import java.util.concurrent.Executors;

public class PawLifeServer {
    public static final int PORT = 3000;

    public static void main(String[] args) {
        try {
            System.out.println("===============================================================");
            System.out.println("🐾 PawLife Java Enterprise Backend Server");
            System.out.println("SLIIT Year 2 Semester 1 - Software Engineering (SE2030)");
            System.out.println("Group MLB-B6G2-07 | Enterprise Core Demonstration");
            System.out.println("===============================================================");

            // Verify database connection
            try {
                var test = Database.getFirst("SELECT COUNT(*) AS total_users FROM users");
                System.out.println("✅ Connected to SQLite database: database/pawlife.db (Users: " + (test != null ? test.get("total_users") : 0) + ")");
            } catch (Exception e) {
                System.err.println("⚠️ Warning: SQLite initial query note: " + e.getMessage());
            }

            HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);

            // API Contexts
            AdminHandler adminHandler = new AdminHandler();
            PetEhrHandler petEhrHandler = new PetEhrHandler();
            AppointmentHandler apptHandler = new AppointmentHandler();
            InventoryHandler invHandler = new InventoryHandler();
            OperationsHandler opHandler = new OperationsHandler();
            GroomingHandler groomHandler = new GroomingHandler();
            NotificationHandler notifHandler = new NotificationHandler();
            CustomerHandler customerHandler = new CustomerHandler();

            server.createContext("/api/admin", adminHandler);
            server.createContext("/api/auth", adminHandler);
            server.createContext("/api/customer", customerHandler);
            server.createContext("/api/pets", petEhrHandler);
            server.createContext("/api/consultations", petEhrHandler);
            server.createContext("/api/vaccinations", petEhrHandler);
            server.createContext("/api/appointments", apptHandler);
            server.createContext("/api/inventory", invHandler);
            server.createContext("/api/operations", opHandler);
            server.createContext("/api/grooming", groomHandler);
            server.createContext("/api/notifications", notifHandler);

            // Static Frontend Handler (Root & Dashboard)
            server.createContext("/", new StaticFileHandler());

            server.setExecutor(Executors.newFixedThreadPool(20));
            server.start();

            System.out.println("🚀 Server active and listening at: http://localhost:" + PORT);
            System.out.println("   Public Storefront: http://localhost:" + PORT + "/#store-section");
            System.out.println("   Staff Dashboard:   http://localhost:" + PORT + "/dashboard");
            System.out.println("===============================================================");

        } catch (Exception e) {
            System.err.println("Fatal Server Startup Error: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }
}

package com.pawlife;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class PawLifeApplication {
    public static void main(String[] args) {
        System.out.println("===============================================================");
        System.out.println("🐾 PawLife Spring Boot Backend Server");
        System.out.println("SLIIT Year 2 Semester 1 - Software Engineering (SE2030)");
        System.out.println("===============================================================");
        SpringApplication.run(PawLifeApplication.class, args);
        System.out.println("🚀 Server active and listening at: http://localhost:3000");
    }
}

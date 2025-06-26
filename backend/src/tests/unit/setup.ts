// Jest setup file
import { jest } from "@jest/globals";

// Mock console methods in tests to reduce noise
global.console = {
	...console,
	// Keep error and warn for debugging
	log: jest.fn(),
	debug: jest.fn(),
	info: jest.fn(),
};

// Mock process.env for consistent testing
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";
process.env.DATABASE_URL = "postgres://test:test@localhost:5432/test";
process.env.REDIS_ENABLED = "false";

// Increase timeout for async operations
jest.setTimeout(10000);

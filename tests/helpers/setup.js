require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const request = require('supertest');
const app = require('../../src/app');

const prisma = new PrismaClient();

/**
 * Login and return JWT token for a given user.
 */
async function getToken(email, password) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  return res.body.data?.token;
}

/**
 * Wipe all data in correct FK order.
 * Call in beforeAll / afterAll to isolate test state.
 */
async function cleanDb() {
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
}

module.exports = { prisma, request, app, getToken, cleanDb };

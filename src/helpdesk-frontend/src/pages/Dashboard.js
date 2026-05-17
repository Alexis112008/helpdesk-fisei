import React from 'react';
import Layout from '../components/Layout';

function Dashboard() {
  return (
    <Layout>
      <main style={s.content}>
        <div style={s.dashboardGrid}>
          <div style={s.card}>
            <h2 style={s.cardTitle}>
              Bienvenido al Help Desk
            </h2>

            <p style={s.cardText}>
              Gestiona tickets, usuarios y servicios
              desde un solo lugar.
            </p>
          </div>
        </div>
      </main>
    </Layout>
  );
}

const s = {
  content: {
    padding: '32px',
    flex: 1,
  },

  dashboardGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    border: '1px solid #eaecf0',
    padding: 32,
  },

  cardTitle: {
    fontSize: 30,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 10,
  },

  cardText: {
    fontSize: 15,
    color: '#6b7280',
  },
};

export default Dashboard;
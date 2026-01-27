import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  try {
    // Obtener alertas de las últimas 24 horas no enviadas por email
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    const alertsQuery = query(
      collection(db, 'alerts'),
      where('emailSent', '==', false),
      where('createdAt', '>=', Timestamp.fromDate(yesterday))
    );

    const snapshot = await getDocs(alertsQuery);
    
    if (snapshot.empty) {
      return NextResponse.json({ 
        success: true, 
        message: 'No new alerts to send',
        alertCount: 0 
      });
    }

    const alerts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Separar por dirección
    const worsened = alerts.filter((a: any) => a.direction === 'worsened');
    const improved = alerts.filter((a: any) => a.direction === 'improved');

    // Generar HTML del email
    const emailHtml = generateDigestHTML(worsened, improved);

    // Enviar email
    const { data, error } = await resend.emails.send({
      from: 'DRI Command Center <onboarding@resend.dev>',
      to: 'sebastian.sarmiento@alpha.school',
      subject: `📊 DRI Daily Digest: ${alerts.length} Tier Changes`,
      html: emailHtml,
    });

    if (error) {
      console.error('[DIGEST] Email error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Marcar alertas como enviadas (opcional - batch update)
    const batch = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const { updateDoc } = await import('firebase/firestore');
        return updateDoc(doc.ref, { 
          emailSent: true, 
          emailSentAt: new Date(),
          emailRecipient: 'sebastian.sarmiento@alpha.school'
        });
      })
    );

    console.log(`[DIGEST] Sent digest with ${alerts.length} alerts`);

    return NextResponse.json({ 
      success: true, 
      emailId: data?.id,
      alertCount: alerts.length,
      worsened: worsened.length,
      improved: improved.length
    });

  } catch (error: any) {
    console.error('[DIGEST] Fatal error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

function generateDigestHTML(worsened: any[], improved: any[]): string {
  const date = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const worsenedRows = worsened.map(a => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #1e293b;">
        <strong style="color: #f8fafc;">${a.studentName}</strong>
        <br><span style="color: #64748b; font-size: 12px;">${a.studentCourse}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #1e293b; text-align: center;">
        <span style="background: ${getTierBg(a.previousTier)}; color: ${getTierColor(a.previousTier)}; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">${a.previousTier}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #1e293b; text-align: center; color: #ef4444;">→</td>
      <td style="padding: 12px; border-bottom: 1px solid #1e293b; text-align: center;">
        <span style="background: ${getTierBg(a.newTier)}; color: ${getTierColor(a.newTier)}; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">${a.newTier}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #1e293b; text-align: right; color: #64748b; font-size: 12px; font-family: monospace;">
        Risk: ${a.metricsSnapshot?.riskScore || 'N/A'}
      </td>
    </tr>
  `).join('');

  const improvedRows = improved.map(a => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #1e293b;">
        <strong style="color: #f8fafc;">${a.studentName}</strong>
        <br><span style="color: #64748b; font-size: 12px;">${a.studentCourse}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #1e293b; text-align: center;">
        <span style="background: ${getTierBg(a.previousTier)}; color: ${getTierColor(a.previousTier)}; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">${a.previousTier}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #1e293b; text-align: center; color: #10b981;">→</td>
      <td style="padding: 12px; border-bottom: 1px solid #1e293b; text-align: center;">
        <span style="background: ${getTierBg(a.newTier)}; color: ${getTierColor(a.newTier)}; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">${a.newTier}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #1e293b; text-align: right; color: #64748b; font-size: 12px; font-family: monospace;">
        Risk: ${a.metricsSnapshot?.riskScore || 'N/A'}
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); border-radius: 16px; padding: 30px; margin-bottom: 20px; text-align: center;">
      <h1 style="margin: 0; color: #f8fafc; font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">
        📊 DRI Daily Digest
      </h1>
      <p style="margin: 10px 0 0; color: #a5b4fc; font-size: 14px;">
        ${date}
      </p>
    </div>

    <!-- Summary Cards -->
    <div style="display: flex; gap: 12px; margin-bottom: 20px;">
      <div style="flex: 1; background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 20px; text-align: center;">
        <div style="font-size: 32px; font-weight: 900; color: #ef4444;">${worsened.length}</div>
        <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Worsened</div>
      </div>
      <div style="flex: 1; background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 20px; text-align: center;">
        <div style="font-size: 32px; font-weight: 900; color: #10b981;">${improved.length}</div>
        <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Improved</div>
      </div>
    </div>

    ${worsened.length > 0 ? `
    <!-- Worsened Section -->
    <div style="background: #0f172a; border: 1px solid #7f1d1d; border-radius: 12px; margin-bottom: 20px; overflow: hidden;">
      <div style="background: #7f1d1d; padding: 12px 20px;">
        <h2 style="margin: 0; color: #fecaca; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
          🚨 Needs Attention (${worsened.length})
        </h2>
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        ${worsenedRows}
      </table>
    </div>
    ` : ''}

    ${improved.length > 0 ? `
    <!-- Improved Section -->
    <div style="background: #0f172a; border: 1px solid #14532d; border-radius: 12px; margin-bottom: 20px; overflow: hidden;">
      <div style="background: #14532d; padding: 12px 20px;">
        <h2 style="margin: 0; color: #bbf7d0; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
          ✅ Improved (${improved.length})
        </h2>
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        ${improvedRows}
      </table>
    </div>
    ` : ''}

    <!-- Footer -->
    <div style="text-align: center; padding: 20px; color: #475569; font-size: 12px;">
      <p style="margin: 0;">
        <a href="https://alpha-math-dashboard.vercel.app" style="color: #6366f1; text-decoration: none; font-weight: bold;">
          Open DRI Command Center →
        </a>
      </p>
      <p style="margin: 10px 0 0; color: #334155;">
        Alpha Math Dashboard • Automated Daily Report
      </p>
    </div>

  </div>
</body>
</html>
  `;
}

function getTierColor(tier: string): string {
  switch (tier) {
    case 'RED': return '#fca5a5';
    case 'YELLOW': return '#fcd34d';
    case 'GREEN': return '#6ee7b7';
    default: return '#94a3b8';
  }
}

function getTierBg(tier: string): string {
  switch (tier) {
    case 'RED': return 'rgba(239, 68, 68, 0.2)';
    case 'YELLOW': return 'rgba(245, 158, 11, 0.2)';
    case 'GREEN': return 'rgba(16, 185, 129, 0.2)';
    default: return 'rgba(100, 116, 139, 0.2)';
  }
}

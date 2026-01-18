import { NextRequest, NextResponse } from 'next/server';
import { testConnection } from '@/lib/polymarket/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    console.log('[Polymarket Test] Testing API connection...');
    const result = await testConnection();
    
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[Polymarket Test] Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        connected: false,
        gammaApi: false,
        clobApi: false,
        marketsCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}

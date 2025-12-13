import { NextResponse } from 'next/server';
import { loadBoltExpoTemplate } from '@/lib/load-bolt-template';

export async function GET() {
  try {
    const files = await loadBoltExpoTemplate();
    return NextResponse.json({ files });
  } catch (error) {
    console.error('Error loading bolt template:', error);
    return NextResponse.json({ error: 'Failed to load template' }, { status: 500 });
  }
}

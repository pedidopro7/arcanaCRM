import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const schema = z.object({
  website: z.string().optional(), full_name: z.string().min(3), stage_name: z.string().optional(), cpf: z.string().min(11),
  birth_date: z.string().optional(), email: z.string().email(), phone: z.string().min(8), has_company: z.string().optional(),
  cnpj: z.string().optional(), company_name: z.string().optional(), trade_name: z.string().optional(), instagram: z.string().min(2),
  tiktok: z.string().optional(), youtube: z.string().optional(), niche: z.string().optional(), instagram_followers: z.string().optional(),
  city_state: z.string().optional(), postal_code: z.string().min(5), street: z.string().min(2), street_number: z.string().min(1),
  complement: z.string().optional(), district: z.string().min(2), city: z.string().min(2), state: z.string().min(2).max(2),
  shoe_size: z.string().optional(), shirt_size: z.string().optional(), pants_size: z.string().optional(), notes: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos', issues: parsed.error.flatten() }, { status: 400 });
    if (parsed.data.website) return NextResponse.json({ ok: true }); // honeypot
    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ ok: true, demo: true });
    const payload = parsed.data;
    const { data: org, error: orgError } = await supabase.from('organizations').select('id').limit(1).single();
    if (orgError || !org) throw orgError || new Error('Organização não configurada');
    const { data: influencer, error } = await supabase.from('influencers').upsert({
      organization_id: org.id,
      full_name: payload.full_name, stage_name: payload.stage_name || null, cpf: payload.cpf, birth_date: payload.birth_date || null,
      email: payload.email, phone: payload.phone, cnpj: payload.cnpj || null, company_name: payload.company_name || null,
      trade_name: payload.trade_name || null, instagram: payload.instagram, tiktok: payload.tiktok || null, youtube: payload.youtube || null,
      niche: payload.niche || null, instagram_followers: payload.instagram_followers ? Number(payload.instagram_followers) : null,
      postal_code: payload.postal_code, street: payload.street, street_number: payload.street_number, complement: payload.complement || null,
      district: payload.district, city: payload.city, state: payload.state.toUpperCase(), shoe_size: payload.shoe_size || null,
      shirt_size: payload.shirt_size || null, pants_size: payload.pants_size || null, notes: payload.notes || null,
      status: 'new_intake', intake_source: 'public_form', updated_at: new Date().toISOString(),
    }, { onConflict: 'organization_id,email' }).select('id, organization_id, full_name').single();
    if (error) throw error;
    await supabase.from('tasks').insert({ organization_id: influencer.organization_id, influencer_id: influencer.id,
      title: `Revisar novo cadastro — ${influencer.full_name}`, type: 'registration', status: 'todo', priority: 'medium', waiting_for: 'internal',
      due_at: new Date(Date.now()+24*60*60*1000).toISOString() });
    await supabase.from('activity_logs').insert({ organization_id: influencer.organization_id, influencer_id: influencer.id,
      event_type: 'intake_submitted', description: 'Cadastro enviado pelo formulário público.' });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('intake_error', error);
    return NextResponse.json({ error: 'Não foi possível registrar o cadastro' }, { status: 500 });
  }
}

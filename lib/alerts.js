import { supabase } from './supabase';

export async function resolveAlert(alertId, dogName) {
  const { error } = await supabase
    .from('lost_alerts')
    .update({ status: 'found' })
    .eq('id', alertId);

  if (error) { console.log('Resolve error:', error.message); return false; }

  await supabase.from('activity').insert({
    type: 'found',
    icon: '🎉',
    message: `${dogName} was found safe! Thank you community 🐾`,
    neighbourhood: 'Nearby',
    urgent: false,
  });

  return true;
}

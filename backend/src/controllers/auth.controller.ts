import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export class AuthController {
  static async signup(req: Request, res: Response) {
    const { email, password, phone } = req.body;
    if (phone) {
      const { data, error } = await supabase.auth.signInWithOtp({ phone });
      if (error) return res.status(400).json({ error: error.message });
      return res.json({ message: 'OTP sent', data });
    }
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Check email for verification', data });
  }

  static async login(req: Request, res: Response) {
    const { email, password, phone, token } = req.body;
    if (phone && token) {
      const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
      if (error) return res.status(400).json({ error: error.message });
      return res.json({ message: 'Logged in', data });
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Logged in', data });
  }

  // Profile Management
  static async getProfiles(req: Request, res: Response) {
    const user = (req as any).user;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  }

  static async createProfile(req: Request, res: Response) {
    const user = (req as any).user;
    const profileData = req.body;

    // Limit to 3 profiles
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if ((count || 0) >= 3) {
      return res.status(400).json({ error: 'Maximum 3 profiles allowed per account' });
    }

    const { data, error } = await supabase
      .from('profiles')
      .insert({ ...profileData, user_id: user.id })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  }
}

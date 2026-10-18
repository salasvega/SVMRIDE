/**
 * Icônes proposées pour les cartes des listes modulables (étapes, atouts,
 * avantages…), par nom (src/config/textes-listes.ts, NOMS_ICONES).
 */
import {
  Award, BadgeCheck, BadgeEuro, Banknote, Bike, Calendar, CalendarCheck, Camera, CheckCircle, ClipboardCheck, Clock, CreditCard, Euro,
  Eye, FileSignature, FileText, Gauge, Handshake, Heart, Key, Leaf, Mail, MapPin, MessageCircle, Percent, Phone, PiggyBank, Search,
  Settings, Shield, ShieldCheck, Smile, Sparkles, Star, Store, ThumbsUp, Timer, Trophy, Truck, Users, Wrench, Zap, type LucideIcon,
} from 'lucide-react';
import type { NOMS_ICONES } from './textes-listes';

export const ICONES: Record<(typeof NOMS_ICONES)[number], LucideIcon> = {
  Shield, ShieldCheck, BadgeCheck, Award, Trophy, Star, ThumbsUp, Heart, Smile, Users, Handshake,
  CheckCircle, ClipboardCheck, Clock, Timer, Zap, Calendar, CalendarCheck, Eye, Search,
  BadgeEuro, Euro, Banknote, PiggyBank, CreditCard, Percent, FileText, FileSignature,
  Wrench, Settings, Gauge, Bike, Key, Truck, MapPin, Store, Phone, Mail, MessageCircle, Camera, Sparkles, Leaf,
};

/** Libellés des icônes (choix dans l'admin) */
export const NOMS_FR: Record<string, string> = {
  Shield: 'Bouclier', ShieldCheck: 'Bouclier validé', BadgeCheck: 'Badge validé', Award: 'Médaille', Trophy: 'Trophée', Star: 'Étoile',
  ThumbsUp: 'Pouce levé', Heart: 'Cœur', Smile: 'Sourire', Users: 'Personnes', Handshake: 'Poignée de main', CheckCircle: 'Coche',
  ClipboardCheck: 'Liste validée', Clock: 'Horloge', Timer: 'Chronomètre', Zap: 'Éclair', Calendar: 'Calendrier', CalendarCheck: 'Rendez-vous',
  Eye: 'Œil', Search: 'Loupe', BadgeEuro: 'Badge euro', Euro: 'Euro', Banknote: 'Billet', PiggyBank: 'Tirelire', CreditCard: 'Carte bancaire',
  Percent: 'Pourcentage', FileText: 'Document', FileSignature: 'Contrat signé', Wrench: 'Clé à molette', Settings: 'Réglages', Gauge: 'Compteur',
  Bike: 'Deux-roues', Key: 'Clé', Truck: 'Livraison', MapPin: 'Lieu', Store: 'Showroom', Phone: 'Téléphone', Mail: 'E-mail',
  MessageCircle: 'Message', Camera: 'Appareil photo', Sparkles: 'Étincelles', Leaf: 'Feuille',
};

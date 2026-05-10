-- =====================================================
-- VOXBANK SCHEMA - Run this in Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES (extends Supabase auth.users)
-- =====================================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  vox_balance BIGINT DEFAULT 1000 NOT NULL, -- Starting balance: 1000 VOX
  reputation INT DEFAULT 0,
  faction TEXT DEFAULT NULL,
  role TEXT DEFAULT 'citizen' CHECK (role IN ('citizen', 'admin', 'government')),
  is_banned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TRANSACTIONS
-- =====================================================
CREATE TABLE transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  from_user UUID REFERENCES profiles(id),
  to_user UUID REFERENCES profiles(id),
  amount BIGINT NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL CHECK (type IN ('transfer', 'tax', 'salary', 'loan_out', 'loan_repay', 'purchase', 'sale', 'gambling_win', 'gambling_loss', 'reward', 'fine', 'stock_buy', 'stock_sell', 'black_market')),
  description TEXT,
  reference_id UUID, -- for QR payments
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STOCKS
-- =====================================================
CREATE TABLE stocks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ticker TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  description TEXT,
  current_price BIGINT NOT NULL DEFAULT 100,
  previous_price BIGINT NOT NULL DEFAULT 100,
  total_shares BIGINT NOT NULL DEFAULT 10000,
  available_shares BIGINT NOT NULL DEFAULT 10000,
  sector TEXT DEFAULT 'General',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE stock_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  stock_id UUID REFERENCES stocks(id) ON DELETE CASCADE,
  price BIGINT NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_stocks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  stock_id UUID REFERENCES stocks(id) ON DELETE CASCADE,
  shares BIGINT NOT NULL DEFAULT 0,
  avg_buy_price BIGINT NOT NULL DEFAULT 0,
  UNIQUE(user_id, stock_id)
);

-- =====================================================
-- ITEMS & INVENTORY
-- =====================================================
CREATE TABLE items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  base_price BIGINT NOT NULL DEFAULT 10,
  max_supply INT DEFAULT NULL, -- NULL = unlimited
  current_supply INT DEFAULT 0,
  is_tradeable BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  icon TEXT DEFAULT '📦',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_inventory (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  acquired_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- =====================================================
-- MARKETPLACE (player-to-player selling)
-- =====================================================
CREATE TABLE marketplace_listings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price_per_unit BIGINT NOT NULL CHECK (price_per_unit > 0),
  is_black_market BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- BUSINESSES
-- =====================================================
CREATE TABLE businesses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sector TEXT DEFAULT 'General',
  revenue_per_cycle BIGINT DEFAULT 50,
  level INT DEFAULT 1,
  employees INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- LOANS & DEBT
-- =====================================================
CREATE TABLE loans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lender_id UUID REFERENCES profiles(id), -- NULL = bank/government
  borrower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  principal BIGINT NOT NULL,
  remaining_balance BIGINT NOT NULL,
  interest_rate DECIMAL(5,2) DEFAULT 5.00, -- percent per cycle
  status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'paid', 'defaulted')),
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- GOVERNMENT
-- =====================================================
CREATE TABLE government_policies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  policy_type TEXT CHECK (policy_type IN ('tax', 'subsidy', 'ban', 'event', 'custom')),
  value DECIMAL(10,2), -- e.g., tax rate
  is_active BOOLEAN DEFAULT TRUE,
  passed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE elections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  candidates JSONB DEFAULT '[]',
  votes JSONB DEFAULT '{}',
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
  ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '3 days'),
  winner_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- GAMBLING
-- =====================================================
CREATE TABLE gambling_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  game_type TEXT CHECK (game_type IN ('coinflip', 'dice', 'slots', 'roulette')),
  bet_amount BIGINT NOT NULL,
  outcome BIGINT NOT NULL, -- positive = win, negative = loss
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- DAILY CHALLENGES
-- =====================================================
CREATE TABLE daily_challenges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  reward BIGINT DEFAULT 100,
  challenge_type TEXT,
  target_value INT DEFAULT 1,
  active_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE user_challenge_completions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES daily_challenges(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

-- =====================================================
-- QR PAYMENT REQUESTS
-- =====================================================
CREATE TABLE payment_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  from_user UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL CHECK (amount > 0),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '10 minutes'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- GLOBAL ECONOMY EVENTS
-- =====================================================
CREATE TABLE economy_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  effect_type TEXT CHECK (effect_type IN ('market_crash', 'boom', 'tax_holiday', 'double_salary', 'item_drop', 'black_swan')),
  effect_value DECIMAL(10,2),
  is_active BOOLEAN DEFAULT TRUE,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- FACTIONS / GANGS
-- =====================================================
CREATE TABLE factions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  leader_id UUID REFERENCES profiles(id),
  treasury BIGINT DEFAULT 0,
  reputation INT DEFAULT 0,
  member_count INT DEFAULT 1,
  color TEXT DEFAULT '#7c3aed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SEED DATA - Default stocks
-- =====================================================
INSERT INTO stocks (ticker, company_name, description, current_price, previous_price, total_shares, available_shares, sector) VALUES
  ('VXTECH', 'VoxTech Industries', 'Leading tech company in the school economy', 500, 480, 10000, 9000, 'Technology'),
  ('EDUCO', 'EduCorp Learning', 'Education services and tutoring platform', 200, 210, 15000, 14000, 'Education'),
  ('VXFOOD', 'VoxFood Markets', 'Cafeteria and food services chain', 150, 145, 20000, 18000, 'Food & Beverage'),
  ('CRYPT', 'CryptoVox Exchange', 'Digital asset trading platform', 800, 750, 5000, 4500, 'Finance'),
  ('MEDV', 'MedVox Health', 'School healthcare services', 300, 295, 8000, 7500, 'Healthcare'),
  ('XGAME', 'XGame Studios', 'School gaming and entertainment', 450, 430, 6000, 5500, 'Entertainment');

-- =====================================================
-- SEED DATA - Default items
-- =====================================================
INSERT INTO items (name, description, rarity, base_price, max_supply, icon) VALUES
  ('VoxCoin', 'A shiny commemorative coin', 'common', 50, NULL, '🪙'),
  ('Lunch Pass', 'Skip the lunch line once', 'uncommon', 200, NULL, '🎫'),
  ('Golden Pen', 'A legendary golden pen', 'legendary', 5000, 100, '✒️'),
  ('VoxShield', 'Protection from one government tax', 'rare', 1500, 500, '🛡️'),
  ('Hacker Badge', 'Proves you found an exploit in the system', 'epic', 10000, 10, '💻'),
  ('Shadow Key', 'Grants black market access for 24h', 'rare', 800, NULL, '🗝️'),
  ('Fortune Cookie', 'A mystery reward inside', 'common', 100, NULL, '🥠'),
  ('Diamond Vox', 'The rarest item in existence', 'legendary', 50000, 5, '💎');

-- =====================================================
-- SEED DATA - Default daily challenges
-- =====================================================
INSERT INTO daily_challenges (title, description, reward, challenge_type, target_value) VALUES
  ('First Transfer', 'Send VOX to another player', 50, 'transfer', 1),
  ('Market Trader', 'Buy or sell 3 stocks', 100, 'stock_trade', 3),
  ('Social Butterfly', 'Make 5 transactions of any type', 150, 'transactions', 5),
  ('Investor', 'Own shares in 3 different companies', 200, 'portfolio_diversity', 3),
  ('Lucky Draw', 'Try your luck in the casino', 75, 'gamble', 1);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE gambling_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenge_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, only update their own
CREATE POLICY "Profiles viewable by all" ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Transactions: users see their own
CREATE POLICY "Users see own transactions" ON transactions FOR SELECT USING (auth.uid() = from_user OR auth.uid() = to_user);
CREATE POLICY "Service role inserts transactions" ON transactions FOR INSERT WITH CHECK (TRUE);

-- Stocks: readable by all
CREATE POLICY "Stocks readable by all" ON stocks FOR SELECT USING (TRUE);
CREATE POLICY "Stock history readable by all" ON stock_history FOR SELECT USING (TRUE);
CREATE POLICY "User stocks viewable" ON user_stocks FOR SELECT USING (TRUE);
CREATE POLICY "User stocks manageable" ON user_stocks FOR ALL USING (auth.uid() = user_id);

-- Items & Inventory
CREATE POLICY "Items readable by all" ON items FOR SELECT USING (TRUE);
CREATE POLICY "Inventory viewable by owner" ON user_inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Inventory manageable by owner" ON user_inventory FOR ALL USING (auth.uid() = user_id);

-- Marketplace
CREATE POLICY "Marketplace viewable by all" ON marketplace_listings FOR SELECT USING (expires_at > NOW());
CREATE POLICY "Sellers manage own listings" ON marketplace_listings FOR ALL USING (auth.uid() = seller_id);

-- Businesses
CREATE POLICY "Businesses viewable by all" ON businesses FOR SELECT USING (TRUE);
CREATE POLICY "Owners manage own businesses" ON businesses FOR ALL USING (auth.uid() = owner_id);

-- Loans
CREATE POLICY "Users see own loans" ON loans FOR SELECT USING (auth.uid() = borrower_id OR auth.uid() = lender_id);

-- Public tables
CREATE POLICY "Elections viewable by all" ON elections FOR SELECT USING (TRUE);
CREATE POLICY "Challenges viewable by all" ON daily_challenges FOR SELECT USING (TRUE);
CREATE POLICY "Events viewable by all" ON economy_events FOR SELECT USING (TRUE);
CREATE POLICY "Factions viewable by all" ON factions FOR SELECT USING (TRUE);
CREATE POLICY "Policies viewable by all" ON government_policies FOR SELECT USING (TRUE);

-- Payment requests
CREATE POLICY "Payment requests viewable by owner" ON payment_requests FOR SELECT USING (auth.uid() = from_user);
CREATE POLICY "Payment requests insertable" ON payment_requests FOR INSERT WITH CHECK (auth.uid() = from_user);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Safe transfer function (atomic, prevents double-spend)
CREATE OR REPLACE FUNCTION transfer_vox(
  p_from_user UUID,
  p_to_user UUID,
  p_amount BIGINT,
  p_type TEXT DEFAULT 'transfer',
  p_description TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_from_balance BIGINT;
  v_result JSONB;
BEGIN
  -- Lock and check balance
  SELECT vox_balance INTO v_from_balance FROM profiles WHERE id = p_from_user FOR UPDATE;
  
  IF v_from_balance < p_amount THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Insufficient balance');
  END IF;
  
  -- Deduct from sender
  UPDATE profiles SET vox_balance = vox_balance - p_amount WHERE id = p_from_user;
  
  -- Add to receiver
  UPDATE profiles SET vox_balance = vox_balance + p_amount WHERE id = p_to_user;
  
  -- Record transaction
  INSERT INTO transactions (from_user, to_user, amount, type, description, reference_id)
  VALUES (p_from_user, p_to_user, p_amount, p_type, p_description, p_reference_id);
  
  RETURN jsonb_build_object('success', TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Stock price update function
CREATE OR REPLACE FUNCTION update_stock_prices() RETURNS void AS $$
DECLARE
  v_stock RECORD;
  v_change DECIMAL;
  v_new_price BIGINT;
BEGIN
  FOR v_stock IN SELECT * FROM stocks WHERE is_active = TRUE LOOP
    -- Random walk: -8% to +8%
    v_change := (RANDOM() * 16 - 8) / 100.0;
    v_new_price := GREATEST(10, ROUND(v_stock.current_price * (1 + v_change)));
    
    -- Save history
    INSERT INTO stock_history (stock_id, price) VALUES (v_stock.id, v_stock.current_price);
    
    -- Update stock
    UPDATE stocks SET 
      previous_price = current_price,
      current_price = v_new_price,
      updated_at = NOW()
    WHERE id = v_stock.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get leaderboard
CREATE OR REPLACE FUNCTION get_leaderboard() RETURNS TABLE(
  rank BIGINT,
  id UUID,
  username TEXT,
  display_name TEXT,
  vox_balance BIGINT,
  reputation INT,
  faction TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY vox_balance DESC) as rank,
    p.id, p.username, p.display_name, p.vox_balance, p.reputation, p.faction
  FROM profiles p
  WHERE NOT p.is_banned
  ORDER BY p.vox_balance DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

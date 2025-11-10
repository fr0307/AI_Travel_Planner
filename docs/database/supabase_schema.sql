-- AI旅行规划器 - Supabase数据库初始化脚本
-- 创建时间: $(date)

-- 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) NOT NULL,
    avatar VARCHAR(500),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 行程表
CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    departure VARCHAR(200),
    destination VARCHAR(200) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    budget DECIMAL(10,2),
    travelers_count INTEGER DEFAULT 1,
    preferences JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'planned', 'in_progress', 'completed', 'cancelled')),
    ai_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 行程天数表
CREATE TABLE IF NOT EXISTS trip_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    date DATE NOT NULL,
    summary TEXT,
    notes TEXT,
    ai_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(trip_id, day_number)
);

-- 行程项目表（每日的具体安排）
CREATE TABLE IF NOT EXISTS trip_day_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_day_id UUID REFERENCES trip_days(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('attraction', 'restaurant', 'hotel', 'transport', 'activity', 'other')),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    location VARCHAR(500),
    start_time TIME,
    end_time TIME,
    duration_minutes INTEGER,
    cost DECIMAL(10,2),
    notes TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 景点收藏表
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('attraction', 'restaurant', 'hotel')),
    item_name VARCHAR(200) NOT NULL,
    item_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 语音记录表
CREATE TABLE IF NOT EXISTS voice_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    audio_url VARCHAR(500),
    text_content TEXT,
    confidence_score DECIMAL(3,2),
    duration_seconds INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI规划记录表
CREATE TABLE IF NOT EXISTS ai_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    prompt TEXT NOT NULL,
    response JSONB NOT NULL,
    model_used VARCHAR(100),
    tokens_used INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_destination ON trips(destination);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trip_days_trip_id ON trip_days(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_day_items_trip_day_id ON trip_day_items(trip_day_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_records_user_id ON voice_records(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_plans_user_id ON ai_plans(user_id);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要更新时间的表创建触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trip_days_updated_at BEFORE UPDATE ON trip_days FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trip_day_items_updated_at BEFORE UPDATE ON trip_day_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入示例数据（可选）
INSERT INTO users (id, email, username, preferences) VALUES 
('11111111-1111-1111-1111-111111111111', 'demo@example.com', '演示用户', '{"theme": "light", "language": "zh-CN"}');

INSERT INTO trips (id, user_id, title, destination, start_date, end_date, budget, travelers_count, preferences) VALUES 
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '北京三日游', '北京', '2024-01-15', '2024-01-17', 5000.00, 2, '{"interests": ["历史", "美食"], "transport": "地铁"}');

-- 启用Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_day_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_plans ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略（需要根据实际认证系统调整）
-- 这里使用简单的策略，实际应该基于Supabase Auth集成
CREATE POLICY "用户只能访问自己的数据" ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY "用户只能访问自己的行程" ON trips FOR ALL USING (user_id = auth.uid());
CREATE POLICY "用户只能访问自己的行程天数" ON trip_days FOR ALL USING (EXISTS (SELECT 1 FROM trips WHERE trips.id = trip_days.trip_id AND trips.user_id = auth.uid()));
CREATE POLICY "用户只能访问自己的收藏" ON favorites FOR ALL USING (user_id = auth.uid());
CREATE POLICY "用户只能访问自己的语音记录" ON voice_records FOR ALL USING (user_id = auth.uid());
CREATE POLICY "用户只能访问自己的AI规划" ON ai_plans FOR ALL USING (user_id = auth.uid());
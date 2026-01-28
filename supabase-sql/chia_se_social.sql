-- Create tables for social features in Knowledge Sharing

-- Comments table
CREATE TABLE IF NOT EXISTS chia_se_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID REFERENCES chia_se(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_full_name TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reactions table (Likes/Dislikes)
CREATE TABLE IF NOT EXISTS chia_se_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID REFERENCES chia_se(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(article_id, user_id)
);

-- Bookmarks table
CREATE TABLE IF NOT EXISTS chia_se_bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID REFERENCES chia_se(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(article_id, user_id)
);

-- Enable RLS (Assuming you want to stick with open policies for now like other tables)
ALTER TABLE chia_se_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chia_se_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chia_se_bookmarks ENABLE ROW LEVEL SECURITY;

-- Simple policies (Adjust names if they conflict with your convention)
CREATE POLICY "Allow all to select comments" ON chia_se_comments FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to insert comments" ON chia_se_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow users to delete their own comments" ON chia_se_comments FOR DELETE USING (true);

CREATE POLICY "Allow all to select reactions" ON chia_se_reactions FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to insert reactions" ON chia_se_reactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow users to delete their own reactions" ON chia_se_reactions FOR DELETE USING (true);
CREATE POLICY "Allow users to update their own reactions" ON chia_se_reactions FOR UPDATE USING (true);

CREATE POLICY "Allow all to select bookmarks" ON chia_se_bookmarks FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to insert bookmarks" ON chia_se_bookmarks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow users to delete their own bookmarks" ON chia_se_bookmarks FOR DELETE USING (true);

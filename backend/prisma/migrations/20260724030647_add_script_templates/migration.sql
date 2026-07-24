-- CreateTable
CREATE TABLE "script_templates" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'adventure',
    "description" TEXT NOT NULL DEFAULT '',
    "coverEmoji" TEXT NOT NULL DEFAULT '📖',
    "world_setting" TEXT NOT NULL DEFAULT '',
    "style_prompt" TEXT NOT NULL DEFAULT '',
    "npc_template" TEXT NOT NULL DEFAULT '[]',
    "attr_template" TEXT NOT NULL DEFAULT '[]',
    "node_template" TEXT NOT NULL DEFAULT '[]',
    "use_count" INTEGER NOT NULL DEFAULT 0,
    "rating" REAL NOT NULL DEFAULT 0,
    "author_id" INTEGER,
    "is_official" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

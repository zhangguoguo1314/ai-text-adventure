-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_script_templates" (
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
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "author_id" INTEGER,
    "is_official" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_script_templates" ("attr_template", "author_id", "category", "coverEmoji", "created_at", "description", "id", "is_official", "name", "node_template", "npc_template", "rating", "style_prompt", "use_count", "world_setting") SELECT "attr_template", "author_id", "category", "coverEmoji", "created_at", "description", "id", "is_official", "name", "node_template", "npc_template", "rating", "style_prompt", "use_count", "world_setting" FROM "script_templates";
DROP TABLE "script_templates";
ALTER TABLE "new_script_templates" RENAME TO "script_templates";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

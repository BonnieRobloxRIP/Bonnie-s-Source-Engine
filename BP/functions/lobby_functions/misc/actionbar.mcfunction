# = WHEN AT SPAWN =

# = WHEN IN ELEVATOR =
# // Easy
execute as @a[tag=easylift] at @s if score start easy matches 0 run titleraw @s actionbar {"rawtext":[{"text": "§aEasy Mode: §fLowering in §a§l"}, {"score": {"name": "timer_s", "objective": "easy"}}, {"text": "§r§f Seconds. §7(Ready §a"}, {"score": {"name": "ready", "objective": "easy"}}, {"text": "§7/"}, {"score": {"name": "ready_need", "objective": "easy"}}, {"text": "§7)"}]}
execute as @a[tag=easylift] at @s if score start easy matches 1 if score alarm easy matches 1 run titleraw @s actionbar {"rawtext":[{"text": "§2Lowering."}]}
execute as @a[tag=easylift] at @s if score start easy matches 1 if score alarm easy matches 5 run titleraw @s actionbar {"rawtext":[{"text": "§2Lowering.."}]}
execute as @a[tag=easylift] at @s if score start easy matches 1 if score alarm easy matches 10 run titleraw @s actionbar {"rawtext":[{"text": "§2Lowering..."}]}
# // Medium
execute as @a[tag=mediumlift] at @s if score start medium matches 0 run titleraw @s actionbar {"rawtext":[{"text": "§eMedium Mode: §fLowering in §e§l"}, {"score": {"name": "timer_s", "objective": "medium"}}, {"text": "§r§f Seconds. §7(Ready §e"}, {"score": {"name": "ready", "objective": "medium"}}, {"text": "§7/"}, {"score": {"name": "ready_need", "objective": "medium"}}, {"text": "§7)"}]}
execute as @a[tag=mediumlift] at @s if score start medium matches 1 if score alarm medium matches 1 run titleraw @s actionbar {"rawtext":[{"text": "§eLowering."}]}
execute as @a[tag=mediumlift] at @s if score start medium matches 1 if score alarm medium matches 5 run titleraw @s actionbar {"rawtext":[{"text": "§eLowering.."}]}
execute as @a[tag=mediumlift] at @s if score start medium matches 1 if score alarm medium matches 10 run titleraw @s actionbar {"rawtext":[{"text": "§eLowering..."}]}
# // Hard
execute as @a[tag=hardlift] at @s if score start hard matches 0 run titleraw @s actionbar {"rawtext":[{"text": "§4§lHard Mode: §r§fLowering in §4§l"}, {"score": {"name": "timer_s", "objective": "hard"}}, {"text": "§r§f Seconds. §7(Ready §4"}, {"score": {"name": "ready", "objective": "hard"}}, {"text": "§7/"}, {"score": {"name": "ready_need", "objective": "hard"}}, {"text": "§7)"}]}
execute as @a[tag=hardlift] at @s if score start hard matches 1 if score alarm hard matches 1 run titleraw @s actionbar {"rawtext":[{"text": "§4Lowering."}]}
execute as @a[tag=hardlift] at @s if score start hard matches 1 if score alarm hard matches 5 run titleraw @s actionbar {"rawtext":[{"text": "§4Lowering.."}]}
execute as @a[tag=hardlift] at @s if score start hard matches 1 if score alarm hard matches 10 run titleraw @s actionbar {"rawtext":[{"text": "§4Lowering..."}]}
# // Extreme Challenge 1
execute as @a[tag=extremechallenge1lift] at @s if score start extremechallenge1 matches 0 if score challenge extremechallenge1 matches 1 run titleraw @s actionbar {"rawtext":[{"text": "§b§lInsulated Exoplanet§5: §r§dLowering in §5§l"}, {"score": {"name": "timer_s", "objective": "extremechallenge1"}}, {"text": "§r§d Seconds. §7(Ready §5"}, {"score": {"name": "ready", "objective": "extremechallenge1"}}, {"text": "§7/"}, {"score": {"name": "ready_need", "objective": "extremechallenge1"}}, {"text": "§7)"}]}
execute as @a[tag=extremechallenge1lift] at @s if score start extremechallenge1 matches 1 if score alarm extremechallenge1 matches 1 run titleraw @s actionbar {"rawtext":[{"text": "§5Lowering."}]}
execute as @a[tag=extremechallenge1lift] at @s if score start extremechallenge1 matches 1 if score alarm extremechallenge1 matches 5 run titleraw @s actionbar {"rawtext":[{"text": "§dLowering.."}]}
execute as @a[tag=extremechallenge1lift] at @s if score start extremechallenge1 matches 1 if score alarm extremechallenge1 matches 10 run titleraw @s actionbar {"rawtext":[{"text": "§cLowering..."}]}
# // Endless
execute as @a[tag=endlesslift] at @s if score start endless matches 0 run titleraw @s actionbar {"rawtext":[{"text": "§9Endless Mode: §fLowering in §9§l"}, {"score": {"name": "timer_s", "objective": "endless"}}, {"text": "§r§f Seconds. §7(Ready §9"}, {"score": {"name": "ready", "objective": "endless"}}, {"text": "§7/"}, {"score": {"name": "ready_need", "objective": "endless"}}, {"text": "§7)"}]}
execute as @a[tag=endlesslift] at @s if score start endless matches 1 run titleraw @s actionbar {"rawtext":[{"text": "§9God Speed."}]}
# = WHEN IN ELEVATOR & GAMEMODE IS FULL =
# // Easy

# // Medium

# // Hard

# // Extreme

# // Endless

# = WHEN IN-ROUND =
# // Easy

# // Medium

# // Hard

# // Extreme

# // Endless

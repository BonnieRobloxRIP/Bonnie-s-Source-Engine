# = WHEN AT SPAWN =

# = WHEN IN ELEVATOR =
# // Easy
execute as @a[tag=easylift] at @s if score start easy matches 0 run titleraw @s actionbar {"rawtext":[{"text": "§aEasy Mode: §fLowering in §a§l"}, {"score": {"name": "timer_s", "objective": "easy"}}, {"text": "§r§f Seconds."}]}
execute as @a[tag=easylift] at @s if score start easy matches 1 if score alarm easy matches 1 run titleraw @s actionbar {"rawtext":[{"text": "§2Lowering."}]}
execute as @a[tag=easylift] at @s if score start easy matches 1 if score alarm easy matches 5 run titleraw @s actionbar {"rawtext":[{"text": "§2Lowering.."}]}
execute as @a[tag=easylift] at @s if score start easy matches 1 if score alarm easy matches 10 run titleraw @s actionbar {"rawtext":[{"text": "§2Lowering..."}]}
# // Normal

# // Hard

# // Extreme

# // Endless
execute as @a[tag=endlesslift] at @s if score start endless matches 0 run titleraw @s actionbar {"rawtext":[{"text": "§9Endless Mode: §fLowering in §9§l"}, {"score": {"name": "timer_s", "objective": "endless"}}, {"text": "§r§f Seconds."}]}
execute as @a[tag=endlesslift] at @s if score start endless matches 1 run titleraw @s actionbar {"rawtext":[{"text": "§9God Speed."}]}
# = WHEN IN ELEVATOR & GAMEMODE IS FULL =
# // Easy

# // Normal

# // Hard

# // Extreme

# // Endless

# = WHEN IN-ROUND =
# // Easy

# // Normal

# // Hard

# // Extreme

# // Endless

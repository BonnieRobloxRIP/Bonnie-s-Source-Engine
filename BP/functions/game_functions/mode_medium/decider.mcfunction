# = ROOMS =
# Picking, loading and running the rooms is done by the script (BP/scripts/rooms).
# Room 1 starts when "started medium" is set to 1 by the lowering function.
# = Players =
execute as @a[tag=mediumlift] at @s run tag @s add medium
execute as @a[tag=medium] at @s run tag @s remove mediumlift
execute as @a[tag=medium] at @s run tag @s remove lobby
scoreboard players operation p_game medium = p_lift medium
scoreboard players operation p_amount medium = p_lift medium
# = ROOM SPAWNER =
scriptevent brr:rooms start medium

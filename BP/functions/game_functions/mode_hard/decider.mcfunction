# = ROOMS =
# Picking, loading and running the rooms is done by the script (BP/scripts/rooms).
# Room 1 starts when "started hard" is set to 1 by the lowering function.
# = Players =
execute as @a[tag=hardlift] at @s run tag @s add hard
execute as @a[tag=hard] at @s run tag @s remove hardlift
execute as @a[tag=hard] at @s run tag @s remove lobby
scoreboard players operation p_game hard = p_lift hard
scoreboard players operation p_amount hard = p_lift hard
# = ROOM SPAWNER =
scriptevent brr:rooms start hard

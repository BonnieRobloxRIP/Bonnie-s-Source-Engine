# = ROOMS =
# Picking, loading and running the rooms is done by the script (BP/scripts/rooms).
# Room 1 starts when "started easy" is set to 1 by the lowering function.
# = Players =
execute as @a[tag=easylift] at @s run tag @s add easy
execute as @a[tag=easy] at @s run tag @s remove easylift
execute as @a[tag=easy] at @s run tag @s remove lobby
scoreboard players operation p_game easy = p_lift easy
scoreboard players operation p_amount easy = p_lift easy
# = ROOM SPAWNER =
scriptevent brr:rooms start easy

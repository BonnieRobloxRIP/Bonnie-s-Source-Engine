# = this creates for a smooth player movement. better than using /tp in a direction.
execute as @s at @s run summon boat ~ ~ ~-1 270 0
execute as @s at @s positioned ~ ~ ~-1 run ride @s start_riding @r[type=boat, r=1] teleport_rider until_full
execute as @s at @s positioned ~ ~ ~-1 run kill @e[type=boat]
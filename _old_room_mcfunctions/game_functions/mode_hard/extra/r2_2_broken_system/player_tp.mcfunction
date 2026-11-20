# = move players seamlessly on the moving platform =
# // up
execute as @s at @s if score R2B2 hard matches 1 run summon boat ~-1 ~1 ~ 0 0
execute as @s at @s if score R2B2 hard matches 1 positioned ~-1 ~1 ~ run ride @s start_riding @r[type=boat, r=1] teleport_rider until_full
execute as @s at @s if score R2B2 hard matches 1 positioned ~-1 ~1 ~ run kill @e[type=boat]
# // down
execute as @s at @s if score R2B2 hard matches 0 run summon boat ~1 ~-1 ~ 0 0
execute as @s at @s if score R2B2 hard matches 0 positioned ~1 ~-1 ~ run ride @s start_riding @r[type=boat, r=1] teleport_rider until_full
execute as @s at @s if score R2B2 hard matches 0 positioned ~1 ~-1 ~ run kill @e[type=boat]
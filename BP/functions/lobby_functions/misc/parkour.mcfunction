# = REWARD =
execute positioned 23 6 17 as @p[tag=lobby, tag=parkour1, tag=parkour2, tag=parkour3, tag=parkour4, r=2, tag=!spectator] at @s run scoreboard players add @s coins_storage 300
execute positioned 23 6 17 as @p[tag=lobby, tag=parkour1, tag=parkour2, tag=parkour3, tag=parkour4, r=2, tag=!spectator] at @s run tellraw @s {"rawtext":[{"text": "§e§l+300 Coins §ffor §abeating the parkour!"}]}
execute positioned 23 6 17 as @p[tag=lobby, tag=parkour1, tag=parkour2, tag=parkour3, tag=parkour4, r=2, tag=!spectator] at @s run tellraw @a {"rawtext":[{"text": "§a"}, {"selector": "@s"}, {"text": " §bHas beaten the parkour"}]}
execute positioned 23 6 17 as @p[tag=lobby, tag=parkour1, tag=parkour2, tag=parkour3, tag=parkour4, r=2, tag=!spectator] at @s run tag @s remove parkour1
execute positioned 23 6 17 as @p[tag=lobby, tag=parkour2, tag=parkour3, tag=parkour4, r=2, tag=!spectator] at @s run tag @s remove parkour2
execute positioned 23 6 17 as @p[tag=lobby, tag=parkour3, tag=parkour4, r=2, tag=!spectator] at @s run tag @s remove parkour3
execute positioned 23 6 17 as @p[tag=lobby, tag=parkour4, r=2, tag=!spectator] at @s run tag @s remove parkour4
execute positioned 23 6 17 as @p[tag=lobby, r=2, tag=!spectator] at @s run tp @s 0 1 -1
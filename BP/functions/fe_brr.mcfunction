# // brr

tp @s 80 150 -20
summon brr:flood_room ~ ~-2 ~ 0 0 * hard_room3
scoreboard players set loaded3 hard 0
scoreboard players set started3 hard 1
scoreboard players set room3 hard 2
scoreboard players set p_game hard 1
tag @s add hard
tag @s add tester
tag @s add hard_music
tag @s remove lobby
scoreboard players reset @s music
execute as @s[type=brr:flood_room, name=hard_room3] at @s if score loaded3 hard matches 0 run structure load "hard:HardTunnel" ~8 ~2 ~-3 90_degrees
execute as @s[type=brr:flood_room, name=hard_room3] at @s if score loaded3 hard matches 0 run tp @a[tag=tester] ^11 ^3 ^-1.5 facing ^9 ^3 ^-1.5
execute as @e[type=brr:flood_room, name=hard_room3] at @s run function game_functions/mode_hard/room3/2_tesla_power

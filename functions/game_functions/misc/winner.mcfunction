# = GG BRO =
tellraw @s {"rawtext":[{"text": "§b§lYOU WON!"}]}
tellraw @s {"rawtext":[{"text": "§e§l+25 Coins §ffor §b§lWinning!"}]}
execute as @s at @s run function game_functions/misc/victory_message
scoreboard players add @s coins_storage 25
scoreboard players add @s win_storage 1
playsound sfx.win @a
execute as @s at @s run function game_functions/reset
tp @s 0 1 -1
particle brr:winner1 ~ ~ ~
particle brr:winner2 ~ ~ ~
title @s times 0 20 20
title @s title §b§lYOU WON :D
tag @s remove win
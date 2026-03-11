execute as @s[tag=!vip, tag=!mega_vip] at @s run scoreboard players add @s coins_storage 1
execute as @s[tag=vip, tag=!mega_vip] at @s run scoreboard players add @s coins_storage 2
execute as @s[tag=mega_vip] at @s run scoreboard players add @s coins_storage 3
execute as @s[tag=!vip, tag=!mega_vip] at @s run tellraw @s {"rawtext":[{"text":"§e§l+1 Coin"}]}
execute as @s[tag=vip, tag=!mega_vip] at @s run tellraw @s {"rawtext":[{"text":"§6§l+2 Coins"}]}
execute as @s[tag=mega_vip] at @s run tellraw @s {"rawtext":[{"text":"§9§l+3 Coins"}]}
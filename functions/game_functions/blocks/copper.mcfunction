execute as @s[tag=!vip, tag=!mega_vip] at @s run scoreboard players add @s coins_storage 2
execute as @s[tag=vip, tag=!mega_vip] at @s run scoreboard players add @s coins_storage 4
execute as @s[tag=mega_vip] at @s run scoreboard players add @s coins_storage 6
execute as @s[tag=!vip, tag=!mega_vip] at @s run tellraw @s {"rawtext":[{"text":"§e§l+2 Coins"}]}
execute as @s[tag=vip, tag=!mega_vip] at @s run tellraw @s {"rawtext":[{"text":"§6§l+4 Coins"}]}
execute as @s[tag=mega_vip] at @s run tellraw @s {"rawtext":[{"text":"§9§l+6 Coins"}]}
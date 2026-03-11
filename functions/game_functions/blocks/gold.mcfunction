execute as @s[tag=!vip, tag=!mega_vip] at @s run scoreboard players add @s coins_storage 3
execute as @s[tag=vip, tag=!mega_vip] at @s run scoreboard players add @s coins_storage 6
execute as @s[tag=mega_vip] at @s run scoreboard players add @s coins_storage 9
execute as @s[tag=!vip, tag=!mega_vip] at @s run tellraw @s {"rawtext":[{"text":"§e§l+3 Coins"}]}
execute as @s[tag=vip, tag=!mega_vip] at @s run tellraw @s {"rawtext":[{"text":"§6§l+6 Coins"}]}
execute as @s[tag=mega_vip] at @s run tellraw @s {"rawtext":[{"text":"§9§l+9 Coins"}]}
# = HOST =
execute as @a[tag=lobby, tag=!game, tag=host] at @s if score enabled lobby matches 0 unless entity @s[x=0, y=1, z=-1, dx=0, dy=0, dz=0] unless score game lobby matches -1 run replaceitem entity @s slot.hotbar 8 brr:sk_game_start 1 0 {"minecraft:item_lock":{"mode": "lock_in_slot"}}
execute as @a[tag=lobby, tag=!game, tag=host] at @s if score enabled lobby matches 1 unless entity @s[x=0, y=1, z=-1, dx=0, dy=0, dz=0] unless score game lobby matches -1 run replaceitem entity @s slot.hotbar 8 brr:sk_game_stop 1 0 {"minecraft:item_lock":{"mode": "lock_in_slot"}}
execute as @a[tag=lobby, tag=!game, tag=music_stop, tag=host] at @s unless entity @s[x=0, y=1, z=-1, dx=0, dy=0, dz=0] unless score game lobby matches -1 run replaceitem entity @s slot.hotbar 7 brr:sk_music_yes 1 0 {"minecraft:item_lock":{"mode": "lock_in_slot"}}
execute as @a[tag=lobby, tag=!game, tag=!music_stop, tag=host] at @s unless entity @s[x=0, y=1, z=-1, dx=0, dy=0, dz=0] unless score game lobby matches -1 run replaceitem entity @s slot.hotbar 7 brr:sk_music_no 1 0 {"minecraft:item_lock":{"mode": "lock_in_slot"}}
execute as @a[tag=lobby, tag=!game, tag=host] at @s unless entity @s[x=0, y=1, z=-1, dx=0, dy=0, dz=0] unless score game lobby matches -1 run replaceitem entity @s slot.hotbar 6 brr:sk_settings 1 0 {"minecraft:item_lock":{"mode": "lock_in_slot"}}
execute as @a[tag=lobby, tag=!game, tag=host] at @s unless entity @s[x=0, y=1, z=-1, dx=0, dy=0, dz=0] unless score game lobby matches -1..0 run replaceitem entity @s slot.hotbar 5 brr:sk_spectate 1 0 {"minecraft:item_lock":{"mode": "lock_in_slot"}}
# = NORMAL PLAYERS =
execute as @a[tag=lobby, tag=!game, tag=music_stop, tag=!host] at @s unless entity @s[x=0, y=1, z=-1, dx=0, dy=0, dz=0] unless score game lobby matches -1 run replaceitem entity @s slot.hotbar 8 brr:sk_music_yes 1 0 {"minecraft:item_lock":{"mode": "lock_in_slot"}}
execute as @a[tag=lobby, tag=!game, tag=!music_stop, tag=!host] at @s unless entity @s[x=0, y=1, z=-1, dx=0, dy=0, dz=0] unless score game lobby matches -1 run replaceitem entity @s slot.hotbar 8 brr:sk_music_no 1 0 {"minecraft:item_lock":{"mode": "lock_in_slot"}}
execute as @a[tag=lobby, tag=!game, tag=!host] at @s unless entity @s[x=0, y=1, z=-1, dx=0, dy=0, dz=0] unless score game lobby matches -1 run replaceitem entity @s slot.hotbar 7 brr:sk_settings 1 0 {"minecraft:item_lock":{"mode": "lock_in_slot"}}
execute as @a[tag=lobby, tag=!game, tag=!host] at @s unless entity @s[x=0, y=1, z=-1, dx=0, dy=0, dz=0] unless score game lobby matches -1..0 run replaceitem entity @s slot.hotbar 6 brr:sk_spectate 1 0 {"minecraft:item_lock":{"mode": "lock_in_slot"}}
# = CLEAR =
execute unless score game lobby matches 1 run clear @a brr:sk_spectate
clear @a[tag=game] oak_sign
clear @a[tag=game] dark_oak_sign
clear @a[tag=game] pale_oak_sign
clear @a[tag=game] birch_sign
clear @a[tag=game] spruce_sign
clear @a[tag=game] acacia_sign
clear @a[tag=game] jungle_sign
clear @a[tag=game] warped_sign
clear @a[tag=game] crimson_sign
clear @a[tag=game] cherry_sign
clear @a[tag=game] mangrove_sign
clear @a[tag=game] bamboo_sign
# = dino speecher =
execute as @a[tag=dino, hasitem={ item=brr:dino_speecher, quantity=0}] at @s unless entity @s[x=0, y=1, z=-1, dx=0, dy=0, dz=0] run give @s brr:dino_speecher 1 0 {"minecraft:item_lock":{"mode": "lock_in_inventory"}}
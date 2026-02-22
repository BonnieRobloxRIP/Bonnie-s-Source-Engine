#clear @a fishing_rod
#clear @a flint_and_steel
#clear @a bell
#clear @a ender_eye
#clear @a lava_bucket
#kill @e[type=!minecraft:player]
music stop
execute as @a[tag=dino, hasitem={ item=paper, quantity=0}] at @s run give @s paper 1 0 {"minecraft:item_lock":{"mode": "lock_in_inventory"}}
#tp @a[tag=!lobby, tag=!game] 0 1 -1
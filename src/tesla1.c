#include "pebble.h"

#define NUM_MENU_SECTIONS 3
#define NUM_FIRST_MENU_ITEMS 2
#define NUM_SECOND_MENU_ITEMS 3
#define NUM_THIRD_MENU_ITEMS 7

static Window *window;

// This is a simple menu layer
static SimpleMenuLayer *simple_menu_layer;

// A simple menu layer can have multiple sections
static SimpleMenuSection menu_sections[NUM_MENU_SECTIONS];

// Each section is composed of a number of menu items
static SimpleMenuItem first_menu_items[NUM_FIRST_MENU_ITEMS];

static SimpleMenuItem second_menu_items[NUM_SECOND_MENU_ITEMS];
static SimpleMenuItem third_menu_items[NUM_THIRD_MENU_ITEMS];

// Menu items can optionally have icons
static GBitmap *menu_icon_image0;
static GBitmap *menu_icon_image2;
static GBitmap *menu_icon_image3;
static GBitmap *menu_icon_image4;

enum {
  TODO_KEY_APPEND,
  TODO_KEY_DELETE,
  TODO_KEY_MOVE,
  TODO_KEY_TOGGLE_STATE,
  TODO_KEY_FETCH,
};
enum {
  AKEY_NUMBER,
  AKEY_TEXT,
};

// Messages//////////////////////

 void out_sent_handler(DictionaryIterator *sent, void *context) {
   // outgoing message was delivered
  // Here we just change the subtitle to a literal string
  first_menu_items[0].subtitle = "Message sent to phone!";
  // Mark the layer to be updated
  layer_mark_dirty(simple_menu_layer_get_layer(simple_menu_layer));
 }


 void out_failed_handler(DictionaryIterator *failed, AppMessageResult reason, void *context) {
   // outgoing message failed
  first_menu_items[0].subtitle = "Msg to phone failed";
  layer_mark_dirty(simple_menu_layer_get_layer(simple_menu_layer));
 }

 void in_received_handler(DictionaryIterator *iter, void *context) {
  // incoming message received
  // Check for fields you expect to receive
  Tuple *tuple1 = dict_find(iter, 1);//temperature

  APP_LOG(APP_LOG_LEVEL_DEBUG, "Pebble: Message recieved.");
  // Act on the found fields received
  if (tuple1 && tuple1->key == 1) {
    APP_LOG(APP_LOG_LEVEL_DEBUG, "Temp: %s %lu", tuple1->value->cstring, tuple1->key);
    first_menu_items[0].subtitle = tuple1->value->cstring;
    //%s", tuple1->value->cstring);//tuple1->value->cstring;
  }

  Tuple *tuple2 = dict_find(iter, 2);
  if(tuple2 && tuple2->key == 2) {
    APP_LOG(APP_LOG_LEVEL_DEBUG, "Charge: %s %lu", tuple2->value->cstring, tuple2->key);
    second_menu_items[1].subtitle = tuple2->value->cstring;
 }
  layer_mark_dirty(simple_menu_layer_get_layer(simple_menu_layer));
}

// end of message /////////////////////


static void sendAppActive() {
  APP_LOG(APP_LOG_LEVEL_INFO, "sendAppActive() = 99: app window is activated");
  DictionaryIterator *iter;
  if (app_message_outbox_begin(&iter) != APP_MSG_OK) {
    return;
  }
  Tuplet value = TupletInteger(0, 99);
  if (dict_write_tuplet(iter, &value) != DICT_OK) {
    return;
  }
  app_message_outbox_send();
}

// You can capture when the user selects a menu icon with a menu item select callback
static void menu_select_callback(int section, int index, void *ctx) {
  DictionaryIterator *iter;
  if (app_message_outbox_begin(&iter) != APP_MSG_OK) {
    first_menu_items[index].subtitle = "cannot msg!";
    layer_mark_dirty(simple_menu_layer_get_layer(simple_menu_layer));
    return;
  }
  Tuplet value = TupletInteger(0, (section * 10) + index);
  // if (dict_write_uint8(iter, TODO_KEY_TOGGLE_STATE, index) != DICT_OK) {
  if (dict_write_tuplet(iter, &value) != DICT_OK) {
    return;
  }
  APP_LOG(APP_LOG_LEVEL_DEBUG, "Sent msg: %d", (section * 10) + index);
  app_message_outbox_send();
  // Here we just change the subtitle to a literal string
  //first_menu_items[index].subtitle = "You've hit select here!";
  // Mark the layer to be updated
  layer_mark_dirty(simple_menu_layer_get_layer(simple_menu_layer));
}

static void menu1_select_callback(int index, void *ctx) {
  menu_select_callback(0,index,ctx);
}
static void menu2_select_callback(int index, void *ctx) {
  menu_select_callback(1,index,ctx);
}
static void menu3_select_callback(int index, void *ctx) {
  menu_select_callback(2,index,ctx);
}

// This initializes the menu upon window load
static void window_load(Window *window) {
  // We'll have to load the icon before we can use it
  sendAppActive();

  // Although we already defined NUM_FIRST_MENU_ITEMS, you can define
  // an int as such to easily change the order of menu items later
  int num_a_items = 0;
  int num_b_items = 0;
  int num_c_items = 0;

  menu_icon_image0 = gbitmap_create_with_resource(RESOURCE_ID_IMAGE_MENU_ICON);
  menu_icon_image2 = gbitmap_create_with_resource(RESOURCE_ID_IMAGE_MENU_ICON_2);
  menu_icon_image3 = gbitmap_create_with_resource(RESOURCE_ID_IMAGE_MENU_ICON_3);
  menu_icon_image4 = gbitmap_create_with_resource(RESOURCE_ID_IMAGE_MENU_ICON_4);
  // menu_icon_image = gbitmap_create_with_resource(RESOURCE_ID_IMAGE_MENU_ICON_2);
  first_menu_items[num_a_items++] = (SimpleMenuItem){
    .title = "Enable A/C",
    .subtitle = "",
    .callback = menu1_select_callback,
    .icon = menu_icon_image4,
  };
  first_menu_items[num_a_items++] = (SimpleMenuItem){
    .title = "Climate status",
    .subtitle = "",
    .callback = menu1_select_callback,
    .icon = menu_icon_image4,
  };
  second_menu_items[num_b_items++] = (SimpleMenuItem){
    .title = "Start charging",
    .subtitle = "open door + start",
    .callback = menu2_select_callback,
    .icon = menu_icon_image2,
    // .icon = gbitmap_create_with_resource(RESOURCE_ID_IMAGE_MENU_ICON_3),
    // This is how you would give a menu item an icon
  };
  second_menu_items[num_b_items++] = (SimpleMenuItem){
    .title = "Charge status",
    // You can also give menu items a subtitle
    .subtitle = "Range, battery %, etc.",
    .callback = menu2_select_callback,
    .icon = menu_icon_image3,
  };
  second_menu_items[num_b_items++] = (SimpleMenuItem){
    .title = "Stop charging",
    // You can also give menu items a subtitle
    .subtitle = "",
    .callback = menu2_select_callback,
    .icon = menu_icon_image3,
  };
  third_menu_items[num_c_items++] = (SimpleMenuItem){
    .title = "Lock doors",
    .callback = menu3_select_callback,
    .icon = menu_icon_image0,
  };
  third_menu_items[num_c_items++] = (SimpleMenuItem){
    .title = "Honk",
    .callback = menu3_select_callback,
    .icon = menu_icon_image0,
  };
  third_menu_items[num_c_items++] = (SimpleMenuItem){
    .title = "Flash lights",
    .callback = menu3_select_callback,
    .icon = menu_icon_image0,
  };
  third_menu_items[num_c_items++] = (SimpleMenuItem){
    .title = "Reconnect",
    .callback = menu3_select_callback,
    .icon = menu_icon_image0,
  };
  third_menu_items[num_c_items++] = (SimpleMenuItem){
    .title = "Car info",
    .callback = menu3_select_callback,
    .icon = menu_icon_image0,
  };
  third_menu_items[num_c_items++] = (SimpleMenuItem){
    .title = "Turn off A/C",
    .callback = menu3_select_callback,
    .icon = menu_icon_image0,
  };
  third_menu_items[num_c_items++] = (SimpleMenuItem){
    .title = "About",
    // You can also give menu items a subtitle
    .subtitle = "By Erik de Bruijn",
    .callback = menu3_select_callback,
    .icon = menu_icon_image0,
  };

  // Bind the menu items to the corresponding menu sections
  menu_sections[0] = (SimpleMenuSection){
    .title = "Climate",
    .num_items = num_a_items,
    .items = first_menu_items,
  };
  menu_sections[1] = (SimpleMenuSection){
    // Menu sections can also have titles as well
    .title = "Battery",
    .num_items = num_b_items,
    .items = second_menu_items,
  };
  menu_sections[2] = (SimpleMenuSection){
    // Menu sections can also have titles as well
    .title = "Misc",
    .num_items = num_c_items,
    .items = third_menu_items,
  };

  // Now we prepare to initialize the simple menu layer
  // We need the bounds to specify the simple menu layer's viewport size
  // In this case, it'll be the same as the window's
  Layer *window_layer = window_get_root_layer(window);
  GRect bounds = layer_get_frame(window_layer);

  // Initialize the simple menu layer
  simple_menu_layer = simple_menu_layer_create(bounds, window, menu_sections, NUM_MENU_SECTIONS, NULL);

  // Add it to the window for display
  layer_add_child(window_layer, simple_menu_layer_get_layer(simple_menu_layer));


}

// Deinitialize resources on window unload that were initialized on window load
void window_unload(Window *window) {
  simple_menu_layer_destroy(simple_menu_layer);

  // Cleanup the menu icon
  gbitmap_destroy(menu_icon_image0);
  gbitmap_destroy(menu_icon_image2);
  gbitmap_destroy(menu_icon_image3);
  gbitmap_destroy(menu_icon_image4);
}



int main(void) {
  // Register message handlers
  app_message_register_outbox_sent(out_sent_handler);
  app_message_register_outbox_failed(out_failed_handler);
  app_message_register_inbox_received(in_received_handler);

  const uint32_t inbound_size = 64;
  const uint32_t outbound_size = 64;
  app_message_open(inbound_size, outbound_size);

  window = window_create();

  // Setup the window handlers
  window_set_window_handlers(window, (WindowHandlers) {
    .load = window_load,
    .unload = window_unload,
  });

  window_stack_push(window, true /* Animated */);

  app_event_loop();

  window_destroy(window);
}









// UNUSED CODE
// You can specify special callbacks to differentiate functionality of a menu item
// static void special_select_callback(int index, void *ctx) {
//   // Of course, you can do more complicated things in a menu item select callback
//   // Here, we have a simple toggle
//   special_flag = !special_flag;

//   SimpleMenuItem *menu_item = &second_menu_items[index];

//   if (special_flag) {
//     menu_item->subtitle = "Okay, it's not so special.";
//   } else {
//     menu_item->subtitle = "Well, maybe a little.";
//   }

//   if (++hit_count > 5) {
//     menu_item->title = "Very Special Item";
//   }

//   // Mark the layer to be updated
//   layer_mark_dirty(simple_menu_layer_get_layer(simple_menu_layer));
// }


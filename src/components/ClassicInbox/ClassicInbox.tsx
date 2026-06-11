 import React, { useState, useEffect } from 'react';
 import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
 
 // Mock data for emails
 const mockEmails = [
   {
     id: '1',
     sender: 'John Doe',
     subject: 'Weekly Report',
     preview: 'Here is the weekly report you requested...',
     timestamp: '2023-06-15T10:30:00Z',
     isUnread: true,
   },
   {
     id: '2',
     sender: 'Jane Smith',
     subject: 'Project Update',
     preview: 'The project is moving along nicely...',
     timestamp: '2023-06-14T15:45:00Z',
     isUnread: false,
   },
   // Add more mock emails as needed
 ];
 
 const ClassicInbox = () => {
   const [emails, setEmails] = useState(mockEmails);
   const [refreshing, setRefreshing] = useState(false);
 
   const onRefresh = () => {
     setRefreshing(true);
     // Simulate refresh
     setTimeout(() => setRefreshing(false), 1000);
   };
 
   const renderEmailItem = ({ item }: { item: any }) => (
     <TouchableOpacity style={[styles.emailItem, item.isUnread && styles.unreadEmail]}>
       <View>
         <Text style={styles.senderText}>{item.sender}</Text>
         <Text style={styles.subjectText}>{item.subject}</Text>
         <Text style={styles.previewText} numberOfLines={1}>{item.preview}</Text>
         <Text style={styles.timestampText}>
           {new Date(item.timestamp).toLocaleDateString()}
         </Text>
       </View>
     </TouchableOpacity>
   );
 
   return (
     <View style={styles.container}>
       <View style={styles.header}>
         <Text style={styles.headerText}>Classic Inbox</Text>
       </View>
       <View style={styles.navBar}>
         <Text style={styles.navButton}>Inbox</Text>
         <Text style={styles.navButton}>Sent</Text>
         <Text style={styles.navButton}>Drafts</Text>
         <Text style={styles.navButton}>All Mail</Text>
       </View>
       <View style={styles.categoryBar}>
         <Text style={styles.categoryButton}>Primary</Text>
         <Text style={styles.categoryButton}>Promotions</Text>
         <Text style={styles.categoryButton}>Updates</Text>
       </View>
       <FlatList
         data={emails}
         renderItem={renderEmailItem}
         keyExtractor={(item) => item.id}
         refreshControl={
           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
         }
       />
     </View>
   );
 };
 
 const styles = StyleSheet.create({
   container: {
     flex: 1,
     padding: 16,
   },
   header: {
     height: 50,
     backgroundColor: '#f0f0f0',
     justifyContent: 'center',
     alignItems: 'center',
   },
   headerText: {
     fontSize: 18,
     fontWeight: 'bold',
   },
   navBar: {
     flexDirection: 'row',
     justifyContent: 'space-around',
     paddingVertical: 10,
     backgroundColor: '#e0e0e0',
   },
   navButton: {
     padding: 10,
     color: '#666',
   },
   categoryBar: {
     flexDirection: 'row',
     justifyContent: 'space-around',
     paddingVertical: 10,
     backgroundColor: '#d0d0d0',
     marginTop: 10,
   },
   categoryButton: {
     padding: 10,
     color: '#333',
   },
   emailItem: {
     padding: 12,
     borderBottomWidth: 1,
     borderBottomColor: '#e0e0e0',
   },
   unreadEmail: {
     borderLeftWidth: 4,
     borderLeftColor: '#007AFF',
   },
   senderText: {
     fontSize: 16,
     fontWeight: 'bold',
   },
   subjectText: {
     fontSize: 14,
     color: '#333',
   },
   previewText: {
     fontSize: 12,
     color: '#666',
     marginTop: 4,
   },
   timestampText: {
     fontSize: 12,
     color: '#999',
     marginTop: 4,
   },
 });
 
 export default ClassicInbox;
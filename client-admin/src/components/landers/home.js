import React, { useEffect, useState } from 'react'
import Layout from './lander-layout'
import { Heading, Box, Text, Link, Button, Card, Flex } from 'theme-ui'
import ExploreKnowledgeBase from './exploreKnowledgeBase'
import Press from './press'
import Url from '../../util/url'
// Using PolisNet directly didn't work well
// Import jQuery for AJAX handling
import $ from 'jquery'

const ConversationCard = ({ conversation }) => {
  const goToConversation = (e) => {
    // Don't navigate if the conversation is inactive
    if (!conversation.is_active) {
      e.stopPropagation();
      return;
    }
    
    // Don't navigate if we don't have a zinvite code
    if (!conversation.zinvite) {
      console.error("Missing zinvite code for conversation", conversation);
      e.stopPropagation();
      return;
    }
    
    // Redirect to the participation interface using the zinvite
    const conversationLink = window.location.origin + '/' + conversation.zinvite;
    window.location.href = conversationLink;
  }

  return (
    <Card 
      sx={{ 
        mb: 3, 
        p: 3, 
        borderRadius: 4,
        boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(.25,.8,.25,1)',
        '&:hover': {
          boxShadow: '0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)'
        }
      }}
      onClick={goToConversation}
    >
      <Flex sx={{ alignItems: 'center', mb: 2 }}>
        <Heading as="h4" sx={{ fontSize: 3, flex: 1 }}>
          {conversation.topic || 'Untitled Conversation'}
        </Heading>
        {!conversation.is_active && (
          <Box sx={{ 
            bg: 'gray.1', 
            color: 'gray.7', 
            px: 2, 
            py: 1, 
            borderRadius: 2,
            fontSize: 0,
            fontWeight: 'bold'
          }}>
            INACTIVE
          </Box>
        )}
      </Flex>
      <Text sx={{ fontSize: 1, color: 'gray.7', mb: 2 }}>
        {conversation.description || 'No description provided'}
      </Text>
      <Flex sx={{ mb: 2 }}>
        {conversation.created && (
          <Text sx={{ fontSize: 0, color: 'gray.5', mr: 3 }}>
            Created: {new Date(parseInt(conversation.created)).toLocaleDateString()}
          </Text>
        )}
        {conversation.zinvite && (
          <Text sx={{ fontSize: 0, color: 'gray.5' }}>
            Link: {conversation.zinvite}
          </Text>
        )}
      </Flex>
      <Flex sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Button 
          variant="text"
          sx={{ fontSize: 1, color: 'blue.6' }}
          onClick={(e) => {
            e.stopPropagation();
            if (conversation.zinvite) {
              // Show loading indicator
              const buttonText = e.currentTarget.textContent;
              e.currentTarget.textContent = 'Generating report...';
              e.currentTarget.disabled = true;

              // First create a report for this conversation
              $.ajax({
                url: '/api/v3/reports',
                type: 'POST', 
                contentType: 'application/json; charset=utf-8',
                xhrFields: { withCredentials: true },
                dataType: 'json',
                data: JSON.stringify({
                  conversation_id: conversation.zinvite
                })
              })
              .then(() => {
                // After creating, get the list of reports for this conversation
                return $.ajax({
                  url: '/api/v3/reports',
                  type: 'GET',
                  contentType: 'application/json; charset=utf-8',
                  xhrFields: { withCredentials: true },
                  dataType: 'json',
                  data: {
                    conversation_id: conversation.zinvite
                  }
                });
              })
              .then((reports) => {
                if (reports && reports.length > 0) {
                  // Navigate to the report using the report ID
                  window.location.href = `${window.location.origin}/report/${reports[0].report_id}`;
                } else {
                  throw new Error('No reports found');
                }
              })
              .fail((jqXHR, message, errorType) => {
                console.error('Error generating report:', message, errorType);
                e.currentTarget.textContent = buttonText;
                e.currentTarget.disabled = false;
                alert('There was an error generating the report. Please try again.');
              });
            }
          }}
        >
          View Report
        </Button>
        <Button 
          variant="outline" 
          sx={{ 
            fontSize: 1,
            opacity: !conversation.is_active ? 0.5 : 1,
            cursor: !conversation.is_active ? 'not-allowed' : 'pointer'
          }}
          disabled={!conversation.is_active}
        >
          {!conversation.is_active ? 'Not Available' : 'Join Conversation'}
        </Button>
      </Flex>
    </Card>
  )
}

const Index = () => {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Fetch real conversations from the API
    fetch('/api/v3/conversations?include_all_public_conversations=true')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch conversations')
        }
        return response.json()
      })
      .then(data => {
        // Filter for public conversations only (including drafts)
        const filteredConversations = data.filter(conv => 
          conv.is_public
        );
        
        // Sort conversations by creation date (newest first)
        const sortedConversations = filteredConversations.sort((a, b) => {
          return new Date(b.created) - new Date(a.created);
        });
        
        setConversations(sortedConversations)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching conversations:', err)
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return (
    <Layout>
      <Heading as="h1" sx={{ my: [4, null, 5], fontSize: [6, null, 7] }}>
        Input Crowd, Output Meaning
      </Heading>
      <Heading
        as="h3"
        sx={{
          fontSize: [3, null, 4],
          lineHeight: 'body',
          mb: [4, null, 5]
        }}>
        Polis is a real-time system for gathering, analyzing and understanding
        what large groups of people think in their own words, enabled by
        advanced statistics and machine learning.
      </Heading>
      
      <Box sx={{ mb: [4, null, 5] }}>
        <Flex sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Heading as="h3" sx={{ fontSize: [4], lineHeight: 'body' }}>
            Active Conversations
          </Heading>
          <Box>
            <Link href="/createuser">Sign up</Link>
            {' or '}
            <Link href="/signin">Sign in</Link>
            {' to create your own conversations'}
          </Box>
        </Flex>
        
        {loading ? (
          <Text>Loading conversations...</Text>
        ) : error ? (
          <Text sx={{ color: 'red' }}>Error loading conversations: {error}</Text>
        ) : conversations.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', bg: 'gray.1', borderRadius: 4 }}>
            <Text sx={{ fontSize: 3, mb: 3 }}>No active public conversations found</Text>
            <Text>When users create public conversations, they will appear here.</Text>
            <Box sx={{ mt: 3 }}>
              <Link href="/signin" sx={{ fontWeight: 'bold' }}>Sign in</Link> to create your own conversations.
            </Box>
          </Box>
        ) : (
          conversations.map(conversation => (
            <ConversationCard 
              key={conversation.conversation_id} 
              conversation={conversation} 
            />
          ))
        )}
      </Box>
      
      <Press />
      <ExploreKnowledgeBase />
      <Heading
        as="h3"
        sx={{ fontSize: [4], lineHeight: 'body', my: [2, null, 3] }}>
        Contribute
      </Heading>
      <Box sx={{ mb: [4, null, 5] }}>
        Explore the code and join the developer community{' '}
        <Link target="_blank" href="https://github.com/compdemocracy/">
          on Github
        </Link>
      </Box>
    </Layout>
  )
}

export default Index

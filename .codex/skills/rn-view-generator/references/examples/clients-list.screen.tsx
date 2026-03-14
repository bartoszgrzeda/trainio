import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

interface ClientListItem {
  id: string;
  fullName: string;
}

interface Props {
  clients: ClientListItem[];
  onOpenCreate: () => void;
  onOpenClient: (id: string) => void;
}

export function ClientListScreenExample({ clients, onOpenCreate, onOpenClient }: Props) {
  const [query, setQuery] = useState('');

  const visibleClients = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return clients;
    }

    return clients.filter(client => client.fullName.toLowerCase().includes(normalized));
  }, [clients, query]);

  return (
    <View testID="screen.clients.list">
      <Text>Clients</Text>

      <TextInput
        testID="input.clients.search"
        accessibilityLabel="Search clients"
        value={query}
        onChangeText={setQuery}
      />

      <Pressable
        testID="button.clients.add"
        accessibilityLabel="Add client"
        onPress={onOpenCreate}>
        <Text>Add</Text>
      </Pressable>

      <View testID="list.clients">
        {visibleClients.map(client => (
          <Pressable
            key={client.id}
            testID={`item.client.${client.id}`}
            onPress={() => onOpenClient(client.id)}>
            <Text>{client.fullName}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
